const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ggkqhpgfgxhxhvmcefad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna3FocGdmZ3hoeGh2bWNlZmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjkxOTIsImV4cCI6MjA4MDM0NTE5Mn0.0h2PjozHn_oep-ofQJNVO3WMBJHHNQygxWEx57T0WRI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing Supabase Connection...");

    // 1. Try to select from followed_artists
    console.log("Attempting to select from 'followed_artists'...");
    const { data, error } = await supabase
        .from('followed_artists')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting from 'followed_artists':");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
    } else {
        console.log("Success! Table 'followed_artists' exists and is accessible.");
        console.log("Data:", data);
    }

    // 2. Try to insert a test artist
    console.log("\nAttempting to insert test artist...");
    const testArtist = "Test Artist " + Date.now();
    const { data: insertData, error: insertError } = await supabase
        .from('followed_artists')
        .insert({ artist_name: testArtist })
        .select();

    if (insertError) {
        console.error("Error inserting into 'followed_artists':");
        console.error("Message:", insertError.message);
        console.error("Code:", insertError.code);
        console.error("Details:", insertError.details);
    } else {
        console.log("Success! Inserted:", insertData);

        // Cleanup
        console.log("Cleaning up...");
        await supabase.from('followed_artists').delete().eq('artist_name', testArtist);
    }
}

testConnection();
