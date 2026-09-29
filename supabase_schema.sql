-- ========================================================
-- ระบบจัดการสต๊อกหนังสือ สำนักพิมพ์ มจร. (MCU Press)
-- คำสั่งสร้างตารางฐานข้อมูล Supabase (PostgreSQL Schema)
-- ========================================================

-- 1. สร้างตารางหนังสือ (Books Table)
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

-- 2. สร้างตารางประวัติความเคลื่อนไหวสต๊อก (Transactions Table)
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

-- 3. สร้างตารางผู้ใช้งานระบบ (Users Table)
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

-- 4. เปิดใช้งาน Row Level Security (RLS)
alter table public.books enable row level security;
alter table public.transactions enable row level security;
alter table public.users enable row level security;

-- 5. กำหนด Policy อนุญาตให้อ่าน/เขียนข้อมูลสำหรับ Web Application
drop policy if exists "Allow all operations on books" on public.books;
create policy "Allow all operations on books" on public.books for all using (true) with check (true);

drop policy if exists "Allow all operations on transactions" on public.transactions;
create policy "Allow all operations on transactions" on public.transactions for all using (true) with check (true);

drop policy if exists "Allow all operations on users" on public.users;
create policy "Allow all operations on users" on public.users for all using (true) with check (true);

-- 6. เปิดระบบ Realtime Synchronization
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.transactions;
