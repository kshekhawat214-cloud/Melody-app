require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const ffmpegPath = require('ffmpeg-static');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DOWNLOADS_DIR = path.join(__dirname, '../downloads');
const STATUS_FILE = path.join(__dirname, '../songsdata/status.json');
const FFMPEG_BIN = ffmpegPath;

const LOG_FILE = path.join(__dirname, '../songsdata/debug_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        console.log(message);
    } catch (e) {
        // Build environment might close stdout
    }
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (e) {
        // Ignore log write errors
    }
}

function updateStatus(state, message, progress = 0, total = 0, addedCount = 0, skippedCount = 0) {
    try {
        const status = { state, message, progress, total, addedCount, skippedCount, timestamp: Date.now() };
        const dir = path.dirname(STATUS_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
    } catch (e) {
        log(`Error writing status: ${e.message}`);
    }
}

// Global Error Handlers
process.on('uncaughtException', (err) => {
    log(`CRITICAL ERROR: ${err.message}\n${err.stack}`);
    updateStatus('error', 'Critical script error occurred.');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    updateStatus('error', 'Unhandled promise rejection.');
    process.exit(1);
});

async function uploadToCloudinary(filePath, publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, {
            resource_type: 'video', // 'video' covers audio for Cloudinary
            public_id: publicId,
            folder: 'spotify_songs',
            overwrite: true
        }, (error, result) => {
            if (error) {
                log(`Cloudinary Upload Error: ${error.message}`);
                resolve(null);
            } else {
                resolve(result);
            }
        });
    });
}

async function smartImport(playlistUrl) {
    try {
        updateStatus('processing', 'Starting Smart Import...', 0, 0);
        log("🚀 Starting Smart Import System...");

        if (!fs.existsSync(DOWNLOADS_DIR)) {
            fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
        }

        // 1. Load Scraped Metadata
        updateStatus('processing', 'Fetching playlist metadata...', 0, 0);
        log("📊 Loading playlist metadata...");

        let playlistData = [];
        const tempSpotdlFile = path.join(DOWNLOADS_DIR, 'playlist_meta.spotdl');

        try {
            updateStatus('processing', 'Fetching song details (this takes a moment)...', 5, 100);
            if (fs.existsSync(tempSpotdlFile)) fs.unlinkSync(tempSpotdlFile);

            // Use --save-file to get JSON
            execSync(`spotdl save "${playlistUrl}" --save-file "${tempSpotdlFile}"`, { stdio: 'inherit', timeout: 60000 }); // Increased timeout to 60s

            if (fs.existsSync(tempSpotdlFile)) {
                playlistData = JSON.parse(fs.readFileSync(tempSpotdlFile, 'utf8'));
            }
        } catch (e) {
            log(`Spotdl save failed or timed out: ${e.message}`);
            log("⚠️  Metadata fetch failed. Switching to Direct Download Mode (No duplicate check).");
        }

        let downloadTarget;
        let isFileTarget = false;
        let totalTracks = 0;
        let skippedCount = 0;
        let currentProgress = 0;
        let addedCount = 0;

        if (playlistData.length === 0) {
            log("⚠️  Could not fetch metadata. Proceeding with direct playlist download.");
            downloadTarget = playlistUrl;
            totalTracks = 100; // Unknown total
        } else {
            log(`   Found ${playlistData.length} tracks in playlist.`);
            totalTracks = playlistData.length;

            // 2. Fetch Existing Songs from DB
            log("🔍 Checking database for duplicates...");
            const { data: dbSongs, error } = await supabase
                .from('songs')
                .select('title, artist');

            if (error) {
                log(`❌ Database error: ${error.message}`);
                updateStatus('error', 'Database error.');
                return;
            }

            const existingSet = new Set(dbSongs.map(s => `${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));

            // 3. Filter New Songs
            const newTracks = playlistData.filter(track => {
                const title = track.name || track.title;
                const artist = track.artist;
                if (!title || !artist) return false;

                const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
                return !existingSet.has(key);
            });

            skippedCount = totalTracks - newTracks.length;
            log(`   ${skippedCount} songs already exist.`);
            log(`   ${newTracks.length} new songs to download.`);

            currentProgress = skippedCount;
            updateStatus('processing', `Skipped ${skippedCount} duplicates. Downloading ${newTracks.length} new songs...`, currentProgress, totalTracks, 0, skippedCount);

            if (newTracks.length === 0) {
                log("✅ All songs are already in the database! Nothing to do.");
                updateStatus('completed', `Import Complete! Skipped ${skippedCount} duplicates.`, 100, 100, 0, skippedCount);
                return;
            }

            const downloadListPath = path.join(DOWNLOADS_DIR, 'to_download.spotdl');
            fs.writeFileSync(downloadListPath, JSON.stringify(newTracks, null, 2));
            downloadTarget = downloadListPath;
            isFileTarget = true;
        }

        // 5. Download New Songs
        log("⬇️  Downloading new songs...");

        const strategies = [
            { name: 'Primary (SoundCloud)', providers: 'soundcloud' },
            { name: 'Secondary (YouTube Music)', providers: 'youtube-music' },
            { name: 'Last Resort (YouTube)', providers: 'youtube' }
        ];

        const { spawn } = require('child_process');
        let downloadSuccess = false;

        for (const strategy of strategies) {
            log(`👉 Trying strategy: ${strategy.name}`);
            updateStatus('downloading', `Downloading with ${strategy.name}...`, currentProgress, totalTracks, addedCount, skippedCount);

            let targetArgForCmd = isFileTarget ? `"${downloadTarget}"` : `"${downloadTarget}"`;

            // Detect platform to choose correct python command
            // Windows usually uses 'python', Linux/Docker uses 'python3'
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

            const downloadCmd = `${pythonCmd} -m spotdl ${targetArgForCmd} --format mp3 --audio ${strategy.providers}`;
            log(`Running command: ${downloadCmd}`);

            let limitDetected = false;

            await new Promise((resolve) => {
                const child = spawn(downloadCmd, { shell: true, cwd: DOWNLOADS_DIR, stdio: ['ignore', 'pipe', 'pipe'] });

                // Kill process if it hangs for more than 5 minutes without output
                let hangTimeout = setTimeout(() => {
                    log("⚠️  Process hung for 5 minutes. Killing...");
                    child.kill();
                    limitDetected = true; // Treat as failure
                }, 300000);

                child.stdout.on('data', (data) => {
                    clearTimeout(hangTimeout);
                    hangTimeout = setTimeout(() => {
                        log("⚠️  Process hung for 5 minutes. Killing...");
                        child.kill();
                        limitDetected = true;
                    }, 300000);

                    const output = data.toString();
                    log(output.trim()); // Log EVERYTHING to catch the error message

                    if (output.includes('429') || output.includes('Too Many Requests') || output.includes('rate limit') || output.includes('Sign in')) {
                        limitDetected = true;
                        log("⚠️  Rate limit or blocking detected!");
                    }

                    if (output.includes('LookupError') || output.includes('No results found')) {
                        limitDetected = true; // Treat as failure to force switch
                        log("⚠️  Song not found on this provider. Switching...");
                    }

                    if (output.includes('LookupError') || output.includes('No results found')) {
                        limitDetected = true;
                        log("⚠️  Song not found on this provider. Marking as failed to try next.");
                    }

                    if (output.includes('Downloaded')) {
                        currentProgress++;
                        updateStatus('downloading', `Downloading...`, currentProgress, totalTracks, addedCount, skippedCount);
                    } else if (output.includes('Downloading')) {
                        // Update status logic...
                        const lines = output.split('\n');
                        for (const line of lines) {
                            if (line.trim().length > 0 && line.includes('Downloading')) {
                                updateStatus('downloading', `Downloading: ${line.substring(0, 40)}...`, currentProgress, totalTracks, addedCount, skippedCount);
                            }
                        }
                    }
                });

                child.stderr.on('data', (data) => {
                    const errOutput = data.toString();
                    log(`STDERR: ${errOutput}`);
                    if (errOutput.includes('429') || errOutput.includes('Too Many Requests')) {
                        limitDetected = true;
                    }
                });

                child.on('close', (code) => {
                    clearTimeout(hangTimeout);
                    if (code === 0 && !limitDetected) {
                        downloadSuccess = true;
                    } else {
                        log(`⚠️  Strategy ${strategy.name} failed or limited (Exit: ${code}).`);
                    }
                    resolve();
                });
            });

            if (downloadSuccess) {
                log(`✅ Download successful with strategy: ${strategy.name}`);
                break;
            } else {
                log("🔄 Switching to next strategy...");
                updateStatus('downloading', `Limit reached. Switching to ${strategies[strategies.indexOf(strategy) + 1]?.name || 'next source'}...`, currentProgress, totalTracks, addedCount, skippedCount);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // 6. Process Downloaded Files
        log("☁️  Processing downloads (Upload & Import)...");
        const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith('.mp3'));

        for (const file of files) {
            updateStatus('processing', `Importing: ${file}`, currentProgress, totalTracks, addedCount, skippedCount);
            log(`   Processing: ${file}`);

            const localPath = path.join(DOWNLOADS_DIR, file);
            let artist = 'Unknown Artist';
            let title = file.replace('.mp3', '');

            if (file.includes(' - ')) {
                const parts = file.replace('.mp3', '').split(' - ');
                if (parts.length >= 2) {
                    artist = parts[0].trim();
                    title = parts.slice(1).join(' - ').trim();
                }
            }

            const { data: doubleCheck } = await supabase
                .from('songs')
                .select('id')
                .eq('title', title)
                .eq('artist', artist)
                .single();

            if (doubleCheck) {
                skippedCount++;
                updateStatus('processing', `Skipped duplicate: ${title}`, currentProgress, totalTracks, addedCount, skippedCount);
                fs.unlinkSync(localPath);
                continue;
            }

            const publicId = `${title}-${artist}`.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 100);
            const uploadResult = await uploadToCloudinary(localPath, publicId);

            if (uploadResult && uploadResult.url) {
                await supabase.from('songs').insert({
                    title,
                    artist,
                    url: uploadResult.url,
                    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&dpr=2&q=80',
                    genre: 'Pop',
                    language: 'English',
                    duration: Math.round(uploadResult.duration || 0),
                    energy: 0.5 + (Math.random() * 0.4),
                    valence: 0.5 + (Math.random() * 0.4),
                    danceability: 0.5 + (Math.random() * 0.4)
                });
                addedCount++;
                fs.unlinkSync(localPath);
            }
        }

        log(`🎉 Smart Import Complete! Added ${addedCount} new songs.`);
        const skippedMsg = skippedCount > 0 ? ` (Skipped ${skippedCount} duplicates)` : '';
        updateStatus('completed', `Import Complete! Added ${addedCount} new songs${skippedMsg}.`, 100, 100, addedCount, skippedCount);

        if (fs.existsSync(tempSpotdlFile)) fs.unlinkSync(tempSpotdlFile);
        if (isFileTarget && fs.existsSync(downloadTarget)) fs.unlinkSync(downloadTarget);

    } catch (err) {
        log(`FATAL ERROR in smartImport: ${err.message}\n${err.stack}`);
        updateStatus('error', `Script failed: ${err.message}`);
    }
}

const url = process.argv[2];
if (!url) {
    log("Please provide a playlist URL.");
    updateStatus('error', 'No URL provided');
} else {
    smartImport(url);
}
