const { createBrowserClient } = require('@supabase/ssr');

try {
    console.log("Testing createBrowserClient with undefined keys...");
    const client = createBrowserClient(undefined, undefined);
    console.log("Client created successfully despite missing keys.");
} catch (e) {
    console.error("Caught expected error:", e.message);
}

try {
    console.log("Testing createBrowserClient with empty keys...");
    const client = createBrowserClient('', '');
    console.log("Client created successfully with empty keys.");
} catch (e) {
    console.error("Caught expected error with empty keys:", e.message);
}
