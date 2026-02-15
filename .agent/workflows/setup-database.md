---
description: SQL para configurar las tablas de Sigma AI en Supabase
---

Para que el historial de chats funcione correctamente, copia y pega este código en el **SQL Editor** de tu proyecto en Supabase:

```sql
-- 1. Crear tabla de chats
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Crear tabla de mensajes
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade,
  role text not null, -- 'user' o 'assistant'
  content text not null,
  image text, -- Nueva columna para guardar imágenes en base64 o URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar Seguridad (RLS) para chats
alter table chats enable row level security;

create policy "Usuarios pueden ver sus propios chats" 
on chats for select using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propios chats" 
on chats for insert with check (auth.uid() = user_id);

-- 4. Habilitar Seguridad (RLS) para mensajes
alter table messages enable row level security;

create policy "Usuarios pueden ver mensajes de sus chats" 
on messages for select using (
  exists (
    select 1 from chats 
    where chats.id = messages.chat_id 
    and chats.user_id = auth.uid()
  )
);

create policy "Usuarios pueden insertar mensajes en sus chats" 
on messages for insert with check (
  exists (
    select 1 from chats 
    where chats.id = messages.chat_id 
    and chats.user_id = auth.uid()
  )
);

create policy "Admins pueden ver todos los chats" 
on chats for select using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);

create policy "Admins pueden ver todos los mensajes" 
on messages for select using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);

-- 5. Crear tabla de perfiles para onboarding
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text unique, -- Nuevo: Para inicio de sesión y perfil
  how_known text, -- ¿De dónde nos has conocido?
  usage_intent text, -- ¿Para qué vas a usar Sigma AI?
  onboarding_completed boolean default false,
  role text default 'normal', -- 'admin', 'normal', 'premium'
  email text,
  total_messages int default 0,
  total_tokens int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS para perfiles
alter table profiles enable row level security;

create policy "Usuarios pueden ver su propio perfil" 
on profiles for select using (auth.uid() = id);

create policy "Admins pueden ver todos los perfiles" 
on profiles for select using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);

create policy "Usuarios pueden actualizar su propio perfil" 
on profiles for update using (auth.uid() = id);

create policy "Admins pueden actualizar cualquier perfil" 
on profiles for update using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);

create policy "Usuarios pueden insertar su propio perfil" 
on profiles for insert with check (auth.uid() = id);

create policy "Admins pueden eliminar perfiles" 
on profiles for delete using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);

-- 6. Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
