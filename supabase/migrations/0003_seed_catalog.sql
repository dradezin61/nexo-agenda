-- Dados fixos do estúdio fictício: modalidades e grade semanal.

insert into public.services (id, slug, name, description, capacity, duration_minutes) values
  (1, 'solo', 'Solo', 'Aula individual, com atenção total do instrutor.', 1, 50),
  (2, 'dupla', 'Dupla', 'Para treinar em dupla, com correções individuais.', 2, 50),
  (3, 'turma', 'Turma', 'Aula em grupo de até 8 pessoas, no ritmo da turma.', 8, 55)
on conflict (id) do nothing;

-- weekday: 0 = domingo, 1 = segunda ... 6 = sábado
insert into public.schedule_template (service_id, weekday, start_time, instructor) values
  -- Turma
  (3, 1, '07:00', 'Marina Costa'), (3, 3, '07:00', 'Marina Costa'), (3, 5, '07:00', 'Marina Costa'),
  (3, 1, '18:30', 'Rafael Lima'),  (3, 3, '18:30', 'Rafael Lima'),  (3, 5, '18:30', 'Rafael Lima'),
  (3, 2, '19:00', 'Júlia Alves'),  (3, 4, '19:00', 'Júlia Alves'),
  (3, 6, '09:00', 'Marina Costa'),
  -- Solo
  (1, 1, '08:00', 'Júlia Alves'), (1, 2, '08:00', 'Júlia Alves'), (1, 3, '08:00', 'Júlia Alves'),
  (1, 4, '08:00', 'Júlia Alves'), (1, 5, '08:00', 'Júlia Alves'),
  (1, 1, '12:00', 'Rafael Lima'), (1, 2, '12:00', 'Rafael Lima'), (1, 3, '12:00', 'Rafael Lima'),
  (1, 4, '12:00', 'Rafael Lima'), (1, 5, '12:00', 'Rafael Lima'),
  (1, 1, '17:00', 'Marina Costa'), (1, 2, '17:00', 'Marina Costa'), (1, 3, '17:00', 'Marina Costa'),
  (1, 4, '17:00', 'Marina Costa'), (1, 5, '17:00', 'Marina Costa'),
  -- Dupla
  (2, 2, '07:00', 'Rafael Lima'),  (2, 4, '07:00', 'Rafael Lima'),
  (2, 2, '18:00', 'Marina Costa'), (2, 4, '18:00', 'Marina Costa'),
  (2, 6, '10:00', 'Júlia Alves')
on conflict (service_id, weekday, start_time) do nothing;
