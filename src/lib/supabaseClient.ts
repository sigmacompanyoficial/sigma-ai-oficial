// @ts-nocheck
'use client';

/*
 * Client-side Supabase instance.
 *
 * IMPORTANT:
 * This project uses a cookie-based auth callback route
 * (see `src/app/auth/callback/route.js`).
 *
 * Therefore, the browser client must also use the cookie-based helpers,
 * otherwise `supabase.auth.getUser()` can be null after OAuth and DB
 * reads/writes will never run.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient(
    supabaseUrl ?? '',
    supabaseAnonKey ?? ''
);

export default supabase;

