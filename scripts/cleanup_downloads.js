require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DOWNLOADS_DIR = path.join(__dirname, '../downloads');

async function cleanupDownloads() {
    console.log("🧹 Starting cleanup of downloads directory...");

    if (!fs.existsSync(DOWNLOADS_DIR)) {
        console.log("Downloads directory does not exist.");
        return;
    }

    const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith('.mp3'));
    console.log(`Found ${files.length} MP3 files.`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const file of files) {
        let artist = 'Unknown Artist';
        let title = file.replace('.mp3', '');

        // Simple parsing logic matching smart_import.js
        if (file.includes(' - ')) {
            const parts = file.replace('.mp3', '').split(' - ');
            if (parts.length >= 2) {
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            }
        }

        // Check DB
        const { data: song, error } = await supabase
            .from('songs')
            .select('id')
            .eq('title', title)
            .eq('artist', artist)
            .single();

        if (song) {
            // Song exists in DB, safe to delete
            try {
                fs.unlinkSync(path.join(DOWNLOADS_DIR, file));
                console.log(`✅ Deleted (In DB): ${file}`);
                deletedCount++;
            } catch (e) {
                console.error(`❌ Failed to delete ${file}:`, e.message);
            }
        } else {
            console.log(`⚠️  Kept (Not in DB): ${file}`);
            keptCount++;
        }
    }

    console.log(`\n🎉 Cleanup Complete!`);
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Kept: ${keptCount}`);
}

cleanupDownloads();
