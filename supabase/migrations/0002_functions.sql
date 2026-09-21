-- Regras de negócio do Nexo Agenda. Todas as alterações passam por estas funções,
-- que conferem quem está chamando e travam a aula para evitar vagas duplicadas.

-- Antecedência mínima para o aluno cancelar ou remarcar.
create function public.change_deadline()
returns interval
language sql
immutable
as $$ select interval '2 hours' $$;

-- Gera as aulas dos próximos dias a partir da grade semanal (idempotente).
create function public.ensure_upcoming_sessions(p_days int default 14)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted int;
begin
  insert into public.class_sessions (service_id, starts_at, capacity, instructor)
  select t.service_id,
         (d.day + t.start_time) at time zone 'America/Sao_Paulo',
         s.capacity,
         t.instructor
  from generate_series(
         (now() at time zone 'America/Sao_Paulo')::date,
         (now() at time zone 'America/Sao_Paulo')::date + least(greatest(p_days, 1), 31),
         interval '1 day'
       ) as d(day)
  join public.schedule_template t on t.weekday = extract(dow from d.day)
  join public.services s on s.id = t.service_id
  on conflict (service_id, starts_at) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- Aulas futuras com a contagem de vagas. A contagem precisa enxergar reservas de
-- todos os alunos, por isso roda como security definer e devolve só números.
create function public.list_upcoming_sessions(p_days int default 7)
returns table (
  id uuid,
  service_id smallint,
  service_slug text,
  service_name text,
  starts_at timestamptz,
  duration_minutes int,
  capacity int,
  booked int,
  instructor text,
  booked_by_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select cs.id,
         cs.service_id,
         s.slug,
         s.name,
         cs.starts_at,
         s.duration_minutes,
         cs.capacity,
         (select count(*)::int from public.bookings b
           where b.session_id = cs.id and b.status = 'confirmed') as booked,
         cs.instructor,
         exists (select 1 from public.bookings b
                  where b.session_id = cs.id and b.status = 'confirmed' and b.user_id = auth.uid()) as booked_by_me
  from public.class_sessions cs
  join public.services s on s.id = cs.service_id
  where cs.status = 'scheduled'
    and cs.starts_at > now()
    and cs.starts_at < now() + make_interval(days => least(greatest(p_days, 1), 31))
  order by cs.starts_at, s.id;
$$;

create function public.book_session(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.class_sessions;
  v_booked int;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  -- Trava a aula: reservas simultâneas esperam em fila e a contagem fica correta.
  select * into v_session from public.class_sessions where id = p_session for update;
  if not found or v_session.status <> 'scheduled' then
    raise exception 'session_unavailable';
  end if;
  if v_session.starts_at <= now() then
    raise exception 'session_started';
  end if;
  if exists (select 1 from public.bookings
              where session_id = p_session and user_id = v_user and status = 'confirmed') then
    raise exception 'already_booked';
  end if;

  select count(*) into v_booked from public.bookings
   where session_id = p_session and status = 'confirmed';
  if v_booked >= v_session.capacity then
    raise exception 'session_full';
  end if;

  insert into public.bookings (session_id, user_id)
  values (p_session, v_user)
  returning id into v_id;
  return v_id;
end;
$$;

create function public.cancel_booking(p_booking uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_booking public.bookings;
  v_starts_at timestamptz;
  v_manager boolean := public.is_manager();
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select b.* into v_booking from public.bookings b where b.id = p_booking for update;
  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_booking.user_id <> v_user and not v_manager then
    raise exception 'forbidden';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_active';
  end if;

  select starts_at into v_starts_at from public.class_sessions where id = v_booking.session_id;
  if not v_manager and v_starts_at - now() < public.change_deadline() then
    raise exception 'too_late';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now()
   where id = p_booking;
end;
$$;

create function public.reschedule_booking(p_booking uuid, p_new_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_booking public.bookings;
  v_old public.class_sessions;
  v_new public.class_sessions;
  v_booked int;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select b.* into v_booking from public.bookings b where b.id = p_booking for update;
  if not found or v_booking.user_id <> v_user then
    raise exception 'booking_not_found';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_active';
  end if;
  if v_booking.session_id = p_new_session then
    raise exception 'same_session';
  end if;

  select * into v_old from public.class_sessions where id = v_booking.session_id;
  if v_old.starts_at - now() < public.change_deadline() then
    raise exception 'too_late';
  end if;

  select * into v_new from public.class_sessions where id = p_new_session for update;
  if not found or v_new.status <> 'scheduled' then
    raise exception 'session_unavailable';
  end if;
  if v_new.service_id <> v_old.service_id then
    raise exception 'different_service';
  end if;
  if v_new.starts_at <= now() then
    raise exception 'session_started';
  end if;
  if exists (select 1 from public.bookings
              where session_id = p_new_session and user_id = v_user and status = 'confirmed') then
    raise exception 'already_booked';
  end if;

  select count(*) into v_booked from public.bookings
   where session_id = p_new_session and status = 'confirmed';
  if v_booked >= v_new.capacity then
    raise exception 'session_full';
  end if;

  insert into public.bookings (session_id, user_id)
  values (p_new_session, v_user)
  returning id into v_id;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), rescheduled_to = v_id
   where id = p_booking;

  return v_id;
end;
$$;

-- Gestão: cria uma aula avulsa. Data e horário são interpretados no fuso de São Paulo.
create function public.create_session(
  p_service smallint,
  p_date date,
  p_time time,
  p_instructor text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts_at timestamptz := (p_date + p_time) at time zone 'America/Sao_Paulo';
  v_capacity int;
  v_id uuid;
begin
  if not public.is_manager() then
    raise exception 'forbidden';
  end if;
  if v_starts_at <= now() then
    raise exception 'session_in_past';
  end if;
  if char_length(trim(coalesce(p_instructor, ''))) = 0 then
    raise exception 'instructor_required';
  end if;

  select capacity into v_capacity from public.services where id = p_service;
  if not found then
    raise exception 'service_not_found';
  end if;

  insert into public.class_sessions (service_id, starts_at, capacity, instructor)
  values (p_service, v_starts_at, v_capacity, trim(p_instructor))
  on conflict (service_id, starts_at) do nothing
  returning id into v_id;

  if v_id is null then
    raise exception 'session_exists';
  end if;
  return v_id;
end;
$$;

-- Gestão: cancela uma aula inteira e devolve quem estava inscrito, para avisar por e-mail.
create function public.cancel_session(p_session uuid)
returns table (email text, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_manager() then
    raise exception 'forbidden';
  end if;

  update public.class_sessions
     set status = 'cancelled'
   where id = p_session and status = 'scheduled' and starts_at > now();
  if not found then
    raise exception 'session_unavailable';
  end if;

  return query
  with cancelled as (
    update public.bookings
       set status = 'cancelled', cancelled_at = now()
     where session_id = p_session and status = 'confirmed'
    returning user_id
  )
  select u.email::text, p.full_name
  from cancelled c
  join public.profiles p on p.id = c.user_id
  join auth.users u on u.id = c.user_id;
end;
$$;

-- Por padrão toda função é executável por qualquer um (inclusive anônimo). Aqui só
-- usuários logados podem chamar; cada função confere o papel quando necessário.
revoke execute on function
  public.ensure_upcoming_sessions(int),
  public.list_upcoming_sessions(int),
  public.book_session(uuid),
  public.cancel_booking(uuid),
  public.reschedule_booking(uuid, uuid),
  public.create_session(smallint, date, time, text),
  public.cancel_session(uuid),
  public.is_manager()
from public, anon;

grant execute on function
  public.ensure_upcoming_sessions(int),
  public.list_upcoming_sessions(int),
  public.book_session(uuid),
  public.cancel_booking(uuid),
  public.reschedule_booking(uuid, uuid),
  public.create_session(smallint, date, time, text),
  public.cancel_session(uuid),
  public.is_manager()
to authenticated;
