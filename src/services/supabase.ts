import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book, StockTransaction, User } from '../types';

/**
 * Sanitizes Supabase URL to strip /rest/v1/ or trailing slashes,
 * ensuring valid base endpoint for Supabase client.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip /rest/v1 or /rest/v1/ suffix if present
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  return cleaned;
}

const DEFAULT_URL = 'https://bofzxwwdzhoebuooeiqx.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZnp4d3dkemhvZWJ1b29laXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDE1MTYsImV4cCI6MjEwNjIxNzUxNn0.wNn2acbElUVOM6AYtBhK8TTlIKea7Ahsn6I952-s3Nc';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_URL;
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_ANON_KEY;

export const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl);
export const SUPABASE_ANON_KEY = (rawKey || '').trim();

export type SupabaseConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'tables_missing'
  | 'error'
  | 'fallback_local';

let connectionStatus: SupabaseConnectionStatus = 'connecting';
const listeners: Array<(status: SupabaseConnectionStatus) => void> = [];

export function getSupabaseStatus(): SupabaseConnectionStatus {
  return connectionStatus;
}

export function setSupabaseStatus(status: SupabaseConnectionStatus) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    listeners.forEach((fn) => fn(status));
    window.dispatchEvent(
      new CustomEvent('supabase_status_changed', { detail: { status } })
    );
  }
}

export function subscribeSupabaseStatus(
  fn: (status: SupabaseConnectionStatus) => void
): () => void {
  listeners.push(fn);
  fn(connectionStatus);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

let clientInstance: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
} catch (err) {
  console.warn('Supabase initialization failed, falling back to LocalStorage:', err);
  setSupabaseStatus('fallback_local');
}

export const supabase = clientInstance;

/**
 * SQL Schema definition for the project.
 * Contains table creations, RLS policies, and realtime publication.
 */
export const SUPABASE_SCHEMA_SQL = `-- ========================================================
-- สำนักพิมพ์ มจร. (MCU Press Inventory System)
-- Supabase Schema & Realtime Setup
-- ========================================================

-- 1. Create Books Table
create table if not exists public.books (
  id text primary key,
  book_name text not null,
  author text not null,
  pages integer default 0,
  isbn text,
  published_year integer default 2567,
  price numeric default 0,
  cover_image text,
  stock_quantity integer default 0,
  category text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);

-- 2. Create Stock Transactions Table
create table if not exists public.transactions (
  id text primary key,
  book_id text references public.books(id) on delete cascade,
  book_name text not null,
  transaction_type text not null, -- 'in', 'increase', 'decrease'
  quantity integer not null default 0,
  stock_before integer not null default 0,
  stock_after integer not null default 0,
  created_at timestamptz default now(),
  created_by text,
  note text
);

-- 3. Create Users Table
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null,
  role text not null default 'Staff',
  status text not null default 'active',
  department text,
  password text,
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS)
alter table public.books enable row level security;
alter table public.transactions enable row level security;
alter table public.users enable row level security;

-- 5. Create Permissive Policies for Web App
drop policy if exists "Allow all operations on books" on public.books;
create policy "Allow all operations on books" on public.books for all using (true) with check (true);

drop policy if exists "Allow all operations on transactions" on public.transactions;
create policy "Allow all operations on transactions" on public.transactions for all using (true) with check (true);

drop policy if exists "Allow all operations on users" on public.users;
create policy "Allow all operations on users" on public.users for all using (true) with check (true);

-- 6. Enable Realtime Sync
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.transactions;
`;

/**
 * Checks whether an error is caused by missing tables (PGRST205 or 42P01)
 */
export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const message = (error.message || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('table') && message.includes('does not exist')
  );
}
