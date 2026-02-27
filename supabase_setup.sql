-- SQL to setup Profiles and Roles logic if not already present

-- 1. Ensure profiles table exists and has necessary columns
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text default 'user', -- 'user', 'premium', 'admin'
  settings jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  total_messages int default 0,
  total_tokens int default 0,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Policies
-- Public profiles are viewable by everyone (or restrict to authenticated)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Admins can update everyone (Optional, requires a recursive check or a separate admin function/claim, 
-- but for simplicity here we rely on the client-side check + backend security definer functions if strict security is needed. 
-- For this prototype, we'll allow users to update themselves, and we might need a specific policy for admins to update others)

-- Simple Admin Policy (Insecure for production without proper claims, but functional for MVP)
-- create policy "Admins can update all profiles"
--   on profiles for update
--   using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- 4. Trigger to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper to make the first user an admin (Replace EMAIL with your email)
-- update public.profiles set role = 'admin' where id in (select id from auth.users where email = 'tu_email@ejemplo.com');

-- 6. Chat Sharing Logic
-- Add is_shared column to chats table if not exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'chats' and column_name = 'is_shared') then
        alter table public.chats add column is_shared boolean default false;
    end if;
end $$;

-- Enable RLS on chats and messages
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Drop existing policies if they conflict (optional, but safer to define clear new ones)
drop policy if exists "Users can view their own chats" on chats;
drop policy if exists "Users can view shared chats" on chats;
drop policy if exists "Users can insert their own chats" on chats;
drop policy if exists "Users can update their own chats" on chats;
drop policy if exists "Users can delete their own chats" on chats;
drop policy if exists "Users can view messages of their chats or shared chats" on messages;

-- CHA TS POLICIES
create policy "Users can view their own chats"
  on chats for select
  using ( auth.uid() = user_id );

create policy "Anyone can view shared chats"
  on chats for select
  using ( is_shared = true );

create policy "Users can insert their own chats"
  on chats for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own chats"
  on chats for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own chats"
  on chats for delete
  using ( auth.uid() = user_id );

-- MESSAGES POLICIES
create policy "Users can view messages of their chats or shared chats"
  on messages for select
  using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and (chats.user_id = auth.uid() or chats.is_shared = true)
    )
  );

create policy "Users can insert messages to their own chats"
  on messages for insert
  with check (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
