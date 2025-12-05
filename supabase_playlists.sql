-- Run this in your Supabase SQL Editor

-- 1. Create Playlists Table
create table playlists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  cover text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Playlist Songs Junction Table
create table playlist_songs (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references playlists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(playlist_id, song_id)
);

-- 3. Enable RLS
alter table playlists enable row level security;
alter table playlist_songs enable row level security;

-- 4. Policies (Public for now, similar to songs)
create policy "Public playlists are viewable by everyone"
on playlists for select to anon using ( true );

create policy "Enable insert for everyone (Temporary)"
on playlists for insert to anon with check ( true );

create policy "Enable update for everyone (Temporary)"
on playlists for update to anon using ( true );

create policy "Public playlist_songs are viewable by everyone"
on playlist_songs for select to anon using ( true );

create policy "Enable insert for everyone (Temporary)"
on playlist_songs for insert to anon with check ( true );

create policy "Enable delete for everyone (Temporary)"
on playlist_songs for delete to anon using ( true );
