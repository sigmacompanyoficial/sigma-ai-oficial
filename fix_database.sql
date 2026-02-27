-- ⚠️ RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX ERRORS ⚠️

-- 1. Add missing columns to 'chats' table
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'chats' and column_name = 'is_shared') then
        alter table public.chats add column is_shared boolean default false;
    end if;
end $$;

-- 2. Add missing columns to 'profiles' table (Required for Admin & Settings)
do $$ 
begin 
    -- Add 'role' if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
        alter table public.profiles add column role text default 'user';
    end if;

    -- Add 'settings' if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'settings') then
        alter table public.profiles add column settings jsonb default '{}'::jsonb;
    end if;
    
     -- Add 'avatar_url' if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'avatar_url') then
        alter table public.profiles add column avatar_url text;
    end if;
end $$;

-- 3. Update Policies for Chat Sharing
-- First, drop existing policies to avoid conflicts
drop policy if exists "Users can view their own chats" on chats;
drop policy if exists "Users can view shared chats" on chats;
drop policy if exists "Anyone can view shared chats" on chats;
drop policy if exists "Users can insert their own chats" on chats;
drop policy if exists "Users can update their own chats" on chats;
drop policy if exists "Users can delete their own chats" on chats;
drop policy if exists "Users can view messages of their chats or shared chats" on messages;
drop policy if exists "Users can insert messages to their own chats" on messages;

-- Re-create Policies
-- Chats
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

-- Messages
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

-- 4. Automatically make your user an Admin (Optional - run only if needed)
-- Replace with your email to become admin immediately
-- update public.profiles set role = 'admin' where id in (select id from auth.users where email = 'YOUR_EMAIL@HERE.com');
