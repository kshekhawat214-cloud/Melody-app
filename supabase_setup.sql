-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PLAYLISTS (Update or Create)
create table if not exists playlists (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  cover text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'playlists' and column_name = 'user_id') then
        alter table playlists add column user_id uuid references auth.users on delete cascade;
    end if;
end $$;

-- 3. PLAYLIST SONGS
create table if not exists playlist_songs (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references playlists(id) on delete cascade,
  song_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. FOLLOWED ARTISTS (Update or Create)
create table if not exists followed_artists (
  id uuid default uuid_generate_v4() primary key,
  artist_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id if not exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'followed_artists' and column_name = 'user_id') then
        alter table followed_artists add column user_id uuid references auth.users on delete cascade;
    end if;
end $$;

-- 6. SONGS (Global Catalog)
create table if not exists songs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  artist text not null,
  url text not null,
  cover text,
  genre text,
  language text,
  energy float default 0.5,
  valence float default 0.5,
  danceability float default 0.5,
  duration integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;
alter table followed_artists enable row level security;
alter table liked_songs enable row level security;
alter table songs enable row level security;

-- Songs: Public Read, Service Role Write (or authenticated if needed)
drop policy if exists "Public songs are viewable by everyone" on songs;
create policy "Public songs are viewable by everyone" on songs for select using (true);

-- Profiles: Public read, Self update
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Playlists: Private (only owner can see/edit)
drop policy if exists "Public Access Playlists" on playlists; -- Remove old policy

drop policy if exists "Users can view own playlists" on playlists;
create policy "Users can view own playlists" on playlists for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own playlists" on playlists;
create policy "Users can insert own playlists" on playlists for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own playlists" on playlists;
create policy "Users can update own playlists" on playlists for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own playlists" on playlists;
create policy "Users can view own followed artists" on followed_artists for select using (auth.uid() = user_id);

drop policy if exists "Users can follow artists" on followed_artists;
create policy "Users can follow artists" on followed_artists for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow artists" on followed_artists;
create policy "Users can unfollow artists" on followed_artists for delete using (auth.uid() = user_id);

-- Liked Songs: Private
drop policy if exists "Users can view own liked songs" on liked_songs;
create policy "Users can view own liked songs" on liked_songs for select using (auth.uid() = user_id);

drop policy if exists "Users can like songs" on liked_songs;
create policy "Users can like songs" on liked_songs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unlike songs" on liked_songs;
create policy "Users can unlike songs" on liked_songs for delete using (auth.uid() = user_id);

-- TRIGGER for Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
