require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
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

const DOWNLOADS_DIR = path.join(__dirname, '../downloads');

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

async function importSongs() {
    console.log("Starting Import...");

    if (!fs.existsSync(DOWNLOADS_DIR)) {
        console.error("Downloads directory not found!");
        return;
    }

    const files = fs.readdirSync(DOWNLOADS_DIR).filter(file => file.endsWith('.mp3'));
    console.log(`Found ${files.length} songs to process.`);

    for (const file of files) {
        console.log(`Processing: ${file}`);

        // Expected format: "Artist - Title.mp3" or just "Title.mp3"
        // spotdl usually does "Artist - Title.mp3"
        let artist = 'Unknown Artist';
        let title = file.replace('.mp3', '');

        if (file.includes(' - ')) {
            const parts = file.replace('.mp3', '').split(' - ');
            if (parts.length >= 2) {
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            }
        }

        // Sanitize for Cloudinary public_id
        const publicId = `${title}-${artist}`.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 100);
        const localPath = path.join(DOWNLOADS_DIR, file);

        // 1. Upload to Cloudinary
        const cloudUrl = await uploadToCloudinary(localPath, publicId);

        if (!cloudUrl) {
            console.error(`Failed to upload: ${file}`);
            continue;
        }

        // 2. Insert into Supabase
        // Check if exists first
        const { data: existing } = await supabase
            .from('songs')
            .select('id')
            .eq('title', title)
            .eq('artist', artist)
            .single();

        if (existing) {
            console.log(`Skipping (Already exists): ${title}`);
            // Delete local file if already exists to save space
            try { fs.unlinkSync(localPath); } catch (e) { console.error("Error deleting duplicate:", e); }
            continue;
        }

        const { error } = await supabase
            .from('songs')
            .insert({
                title: title,
                artist: artist,
                url: cloudUrl,
                cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&dpr=2&q=80', // Default cover, spotdl might download covers too but for now use default
                genre: 'Pop', // Default
                language: 'English', // Default
                energy: 0.5 + (Math.random() * 0.4),
                valence: 0.5 + (Math.random() * 0.4),
                danceability: 0.5 + (Math.random() * 0.4)
            });

        if (error) {
            console.error(`Supabase Insert Error: ${error.message}`);
        } else {
            console.log(`Imported: ${title}`);
            // Delete local file after success
            fs.unlinkSync(localPath);
        }
    }

    console.log("Import Complete!");
}

importSongs();
