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
            resource_type: 'video',
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

async function processRemaining() {
    console.log("🚀 Starting processing of remaining files...");

    if (!fs.existsSync(DOWNLOADS_DIR)) {
        console.log("Downloads directory does not exist.");
        return;
    }

    const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith('.mp3'));
    console.log(`Found ${files.length} MP3 files to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        console.log(`\nProcessing: ${file}`);
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

        // Double check if already in DB (maybe uploaded but file not deleted?)
        const { data: doubleCheck } = await supabase
            .from('songs')
            .select('id')
            .eq('title', title)
            .eq('artist', artist)
            .single();

        if (doubleCheck) {
            console.log("   ⚠️  Song already in DB. Deleting local file.");
            fs.unlinkSync(localPath);
            successCount++;
            continue;
        }

        const publicId = `${title}-${artist}`.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 100);
        console.log("   ☁️  Uploading to Cloudinary...");
        const cloudUrl = await uploadToCloudinary(localPath, publicId);

        if (cloudUrl) {
            console.log("   💾 Saving to Database...");
            const { error } = await supabase.from('songs').insert({
                title,
                artist,
                url: cloudUrl,
                cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&dpr=2&q=80',
                genre: 'Pop',
                language: 'English',
                energy: 0.5 + (Math.random() * 0.4),
                valence: 0.5 + (Math.random() * 0.4),
                danceability: 0.5 + (Math.random() * 0.4)
            });

            if (error) {
                console.error("   ❌ Database Error:", error.message);
                failCount++;
            } else {
                console.log("   ✅ Success! Deleting local file.");
                fs.unlinkSync(localPath);
                successCount++;
            }
        } else {
            console.error("   ❌ Upload Failed.");
            failCount++;
        }
    }

    console.log(`\n🎉 Processing Complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

processRemaining();
