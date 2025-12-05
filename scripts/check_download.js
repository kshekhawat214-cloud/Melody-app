const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSong() {
    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .ilike('title', '%Never Gonna Give You Up%')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Song Found:', data[0].title);
        console.log('URL:', data[0].url);
    } else {
        console.log('Song NOT found yet.');
    }
}

checkSong();
