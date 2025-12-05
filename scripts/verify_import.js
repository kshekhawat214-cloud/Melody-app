require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
    console.log("🔍 Verifying Import...");

    const { count, error: countError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error counting songs:", countError);
        return;
    }

    console.log(`Total Songs in DB: ${count}`);

    const { data: recentSongs, error: listError } = await supabase
        .from('songs')
        .select('title, artist, url, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (listError) {
        console.error("Error listing songs:", listError);
        return;
    }

    console.log("\nMost Recent 10 Songs:");
    recentSongs.forEach(song => {
        console.log(`- [${song.title}] by [${song.artist}]`);
        console.log(`  URL: ${song.url.substring(0, 50)}...`);
    });
}

verify();
