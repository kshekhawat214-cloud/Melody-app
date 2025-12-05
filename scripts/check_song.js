require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSong() {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .ilike('title', '%Bom Diggy Diggy%');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found songs:", data);
    }
}

checkSong();
