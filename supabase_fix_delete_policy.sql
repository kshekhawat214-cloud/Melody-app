-- Run this in your Supabase SQL Editor to fix the deletion issue

-- Enable delete for playlists table
create policy "Enable delete for everyone (Temporary)"
on playlists for delete to anon using ( true );
