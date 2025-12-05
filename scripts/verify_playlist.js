require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPlaylist() {
    console.log("🔍 Verifying playlist songs in database...");

    // We don't have the exact list of titles easily available without parsing the playlist again,
    // but we can check for the most recently added songs.

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: songs, error } = await supabase
        .from('songs')
        .select('title, artist, created_at')
        .gt('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Database error:", error.message);
        return;
    }

    console.log(`Found ${songs.length} songs added in the last 10 minutes:`);
    songs.forEach((song, i) => {
        console.log(`${i + 1}. ${song.title} - ${song.artist} (${new Date(song.created_at).toLocaleTimeString()})`);
    });
}

verifyPlaylist();
