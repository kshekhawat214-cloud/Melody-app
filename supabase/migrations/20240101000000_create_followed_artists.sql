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
