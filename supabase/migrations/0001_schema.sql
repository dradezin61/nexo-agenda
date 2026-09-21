-- Estrutura do Nexo Agenda: perfis, modalidades, grade semanal, aulas e reservas.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'manager');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.services (
  id smallint primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  capacity int not null check (capacity > 0),
  duration_minutes int not null check (duration_minutes > 0)
);

-- Grade semanal do estúdio; as aulas concretas são geradas a partir dela.
create table public.schedule_template (
  id serial primary key,
  service_id smallint not null references public.services (id),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  instructor text not null,
  unique (service_id, weekday, start_time)
);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  service_id smallint not null references public.services (id),
  starts_at timestamptz not null,
  capacity int not null check (capacity > 0),
  instructor text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (service_id, starts_at)
);

create index class_sessions_starts_at_idx on public.class_sessions (starts_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  rescheduled_to uuid references public.bookings (id)
);

-- Um aluno não pode ter duas reservas ativas na mesma aula.
create unique index bookings_one_active_per_session
  on public.bookings (session_id, user_id)
  where status = 'confirmed';

create index bookings_user_idx on public.bookings (user_id);
create index bookings_session_idx on public.bookings (session_id);

-- Cria o perfil automaticamente quando uma conta é criada.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'manager'
  );
$$;

-- Segurança por linha: cada aluno só enxerga o que é dele; a gestão enxerga tudo.
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.schedule_template enable row level security;
alter table public.class_sessions enable row level security;
alter table public.bookings enable row level security;

create policy "perfil próprio ou gestão"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager());

create policy "modalidades são públicas"
  on public.services for select to anon, authenticated
  using (true);

create policy "grade visível para a gestão"
  on public.schedule_template for select to authenticated
  using (public.is_manager());

create policy "aulas visíveis para usuários logados"
  on public.class_sessions for select to authenticated
  using (true);

create policy "reservas próprias ou gestão"
  on public.bookings for select to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- Não há políticas de insert/update/delete: toda alteração passa pelas funções
-- da migração 0002, que aplicam as regras de negócio.
