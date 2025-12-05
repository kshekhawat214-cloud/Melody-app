const fs = require('fs');
const path = require('path');
const os = require('os');
const youtubedl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const url = process.argv[2];

if (!url) {
    console.error("No URL provided");
    process.exit(1);
}

async function processDownload(url) {
    console.log(`Starting process for: ${url}`);
    const tempDir = os.tmpdir();
    const outputTemplate = path.join(tempDir, '%(title)s-%(id)s.%(ext)s');

    try {
        // 1. Get Metadata
        console.log("Fetching metadata...");
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        const title = info.title;
        const artist = info.uploader || info.artist || "Unknown Artist";
        const duration = info.duration;
        const thumbnail = info.thumbnail;
        const videoId = info.id;

        // Check if already exists in DB
        const { data: existing } = await supabase
            .from('songs')
            .select('id')
            .eq('title', title)
            .single();

        if (existing) {
            console.log(`Song already exists in DB: ${title}`);
            return;
        }

        // 2. Download Audio
        console.log(`Downloading: ${title}`);
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputTemplate,
            noCheckCertificates: true,
            noWarnings: true,
            ffmpegLocation: ffmpegPath,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });

        // Find the downloaded file
        const files = fs.readdirSync(tempDir);
        const downloadedFile = files.find(f => f.includes(videoId) && f.endsWith('.mp3'));

        if (!downloadedFile) {
            throw new Error("Downloaded file not found");
        }

        const localPath = path.join(tempDir, downloadedFile);
        console.log(`Downloaded to: ${localPath}`);

        // 3. Upload to Cloudinary
        console.log("Uploading to Cloudinary...");
        const publicId = `${title}-${artist}`.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 100);

        const uploadResult = await cloudinary.uploader.upload(localPath, {
            resource_type: 'video',
            public_id: publicId,
            folder: 'melody_songs',
            unique_filename: false,
            overwrite: true
        });

        console.log(`Uploaded to: ${uploadResult.secure_url}`);

        // 4. Save to Supabase
        console.log("Saving to Supabase...");
        const { error: insertError } = await supabase
            .from('songs')
            .insert({
                title: title,
                artist: artist,
                url: uploadResult.secure_url,
                cover: thumbnail,
                duration: duration,
                genre: 'Unknown', // Could try to extract from tags
                language: 'Unknown',
                energy: 0.5, // Default
                valence: 0.5,
                danceability: 0.5
            });

        if (insertError) {
            throw new Error(`Supabase Insert Error: ${insertError.message}`);
        }

        console.log("Saved to Database!");

        // 5. Cleanup
        fs.unlinkSync(localPath);
        console.log("Cleaned up local file.");

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

processDownload(url);
