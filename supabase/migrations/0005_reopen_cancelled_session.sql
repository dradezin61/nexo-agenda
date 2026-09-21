-- Ao criar uma aula num horário em que havia uma aula cancelada, reabre essa aula
-- em vez de recusar. A restrição (service_id, starts_at) continua valendo para
-- aulas ativas e impede que a grade recrie sozinha uma aula cancelada.

create or replace function public.create_session(
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
    update public.class_sessions
       set status = 'scheduled', instructor = trim(p_instructor), capacity = v_capacity
     where service_id = p_service and starts_at = v_starts_at and status = 'cancelled'
    returning id into v_id;
  end if;

  if v_id is null then
    raise exception 'session_exists';
  end if;
  return v_id;
end;
$$;
