-- Run this in your Supabase SQL Editor

create table songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text,
  album text,
  cover text,
  url text not null,
  duration numeric,
  language text,
  genre text,
  energy numeric,
  valence numeric,
  danceability numeric,
  lyrics text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table songs enable row level security;

-- Create a policy that allows everyone to read songs
create policy "Public songs are viewable by everyone"
on songs for select
to anon
using ( true );

-- Create a policy that allows authenticated users (or service role) to insert/update
-- For simplicity in this migration, we'll allow anon to insert/update for now, 
-- BUT you should disable this after migration!
create policy "Enable insert for everyone (Temporary)"
on songs for insert
to anon
with check ( true );

create policy "Enable update for everyone (Temporary)"
on songs for update
to anon
using ( true );


-- Followed Artists Table
create table followed_artists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid default auth.uid(), -- If using Auth, otherwise null for now
  artist_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, artist_name)
);

-- Enable RLS
alter table followed_artists enable row level security;

-- Policies
create policy "Enable read access for all users"
on followed_artists for select
using (true);

create policy "Enable insert for all users"
on followed_artists for insert
with check (true);

create policy "Enable delete for all users"
on followed_artists for delete
using (true);
