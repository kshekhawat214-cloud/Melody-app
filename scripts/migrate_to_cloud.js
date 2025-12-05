require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

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

const SONGS_CSV = path.join(__dirname, '../songsdata/songs.csv');
const MUSIC_DIR = path.join(__dirname, '../public/music');

async function uploadToCloudinary(filePath, publicId) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'video', // 'video' is used for audio in Cloudinary
            public_id: publicId,
            folder: 'melody_songs',
            unique_filename: false,
            overwrite: false
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Cloudinary Upload Error for ${publicId}:`, error.message);
        return null;
    }
}

async function migrate() {
    console.log("Starting Migration...");
    const songs = [];

    fs.createReadStream(SONGS_CSV)
        .pipe(csv())
        .on('data', (row) => songs.push(row))
        .on('end', async () => {
            console.log(`Found ${songs.length} songs to process.`);

            for (const song of songs) {
                // 1. Find local file
                // The CSV 'url' column has full path or relative path. We need to extract filename.
                // Example CSV url: "A:\projects\spotify songs\downloads\Humdard...webm" OR "/music/Humdard...webm"

                let filename = '';
                if (song.url.includes('/music/')) {
                    filename = song.url.split('/music/')[1];
                } else {
                    filename = path.basename(song.url);
                }

                // Decode URI component in case of %20 etc, though usually files on disk match
                filename = decodeURIComponent(filename);

                const localPath = path.join(MUSIC_DIR, filename);

                if (!fs.existsSync(localPath)) {
                    console.warn(`File not found: ${localPath}`);
                    continue;
                }

                console.log(`Processing: ${song.title}`);

                // 2. Upload to Cloudinary
                // Use title + artist as public_id to keep it readable, sanitize it
                const publicId = `${song.title}-${song.artist}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const cloudUrl = await uploadToCloudinary(localPath, publicId);

                if (!cloudUrl) {
                    console.error(`Failed to upload: ${song.title}`);
                    continue;
                }

                // 3. Insert into Supabase
                // Check if exists first to avoid ON CONFLICT error without constraint
                const { data: existing } = await supabase
                    .from('songs')
                    .select('id')
                    .eq('title', song.title)
                    .eq('artist', song.artist)
                    .single();

                if (existing) {
                    console.log(`Skipping (Already exists): ${song.title}`);
                    continue;
                }

                const { error } = await supabase
                    .from('songs')
                    .insert({
                        title: song.title,
                        artist: song.artist,
                        url: cloudUrl,
                        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&dpr=2&q=80',
                        genre: song.genre,
                        language: song.language,
                        energy: parseFloat(song.energy) || 0.5,
                        valence: parseFloat(song.valence) || 0.5,
                        danceability: parseFloat(song.danceability) || 0.5
                    });

                if (error) {
                    console.error(`Supabase Insert Error: ${error.message}`);
                } else {
                    console.log(`Migrated: ${song.title}`);
                }
            }

            console.log("Migration Complete!");
        });
}

migrate();
