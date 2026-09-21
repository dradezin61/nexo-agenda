-- Corrige a geração de aulas a partir da grade.
--
-- Em 0002, generate_series sobre datas devolve timestamptz (meia-noite em UTC).
-- Somar o horário e aplicar "at time zone 'America/Sao_Paulo'" convertia o fuso
-- duas vezes: as aulas eram gravadas 6 horas antes do horário da grade (07:00
-- virava 01:00). create_session não tinha o problema, porque já recebe uma data.

create or replace function public.ensure_upcoming_sessions(p_days int default 14)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inserted int;
begin
  insert into public.class_sessions (service_id, starts_at, capacity, instructor)
  select t.service_id,
         (d.day + t.start_time) at time zone 'America/Sao_Paulo',
         s.capacity,
         t.instructor
  from generate_series(0, least(greatest(p_days, 1), 31)) as offset_days(n)
  cross join lateral (select v_today + offset_days.n as day) as d
  join public.schedule_template t on t.weekday = extract(dow from d.day)
  join public.services s on s.id = t.service_id
  on conflict (service_id, starts_at) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- Até aqui todas as aulas vieram da grade com o erro (as aulas avulsas de teste
-- foram apagadas). Move cada uma para o horário correto, mantendo as reservas.
update public.class_sessions set starts_at = starts_at + interval '6 hours';
