# Próxima etapa do Cadência: área do instrutor

Planejada em 2026-09-22, para ser feita **depois do Orbe Gestão**. Hoje o
instrutor é apenas um campo de texto (`class_sessions.instructor`): não existe
conta, login nem tela para ele.

## Decisões já tomadas

- **Quem cancela aula:** só a gestão. O instrutor não cancela a própria aula —
  menos risco de aluno perder aula sem controle.
- **Como o instrutor ganha acesso:** a gestão promove uma conta que ele já
  criou no app. Não haverá convite por e-mail nesta etapa.

## Blocos, do menor risco ao maior

**1. Base no banco, sem tela nova**
- Tabela `instructors` ligada a `profiles`; papel `instructor` no tipo `app_role`.
- `instructor_id` em `class_sessions` e em `schedule_template`.
- Migração converte os nomes existentes (Marina Costa, Rafael Lima, Júlia Alves)
  em registros, mantendo o texto atual como fallback para a agenda não quebrar.

**2. "Minhas aulas"**
- Aulas da semana do instrutor: horário, modalidade, vagas ocupadas e inscritos
  (só o nome; o perfil não guarda e-mail).
- Regras em funções SQL com RLS, como no resto do projeto: o instrutor lê as
  reservas **apenas** das aulas que ele dá. Verificar com dados controlados,
  como foi feito na revisão do acesso de gestão.

**3. Presença**
- Tabela `attendance` com presente/faltou por inscrito, liberada a partir do
  horário da aula.
- Abre um indicador novo para a gestão: frequência por aluno e por turma.

**4. Equipe, no painel da gestão**
- Promover uma conta a instrutor e vinculá-la ao nome.
- Trocar a lista fixa de instrutores de `src/lib/studio.ts` pela lista real.
- Substitui o comando manual `npm run db:gestor -- <e-mail>`.
