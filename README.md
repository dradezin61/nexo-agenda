# Nexo Agenda

Sistema de agendamento de aulas para um estúdio de pilates. **Projeto de
demonstração:** o estúdio Nexo, os instrutores e os alunos são fictícios.

Desenvolvido por [Gabriel Andrade](https://gabriel-andrade-omega.vercel.app/).

**Demonstração:** https://nexo-agenda-gamma.vercel.app/ — entre como aluno ou como gestão, sem cadastro.

## O que funciona

**Aluno**
- Cria conta e entra com e-mail e senha. Esqueceu a senha? Recebe por e-mail um
  link de uso único (válido por 1 hora) para criar outra.
- Vê a agenda da semana por dia e modalidade (Solo, Dupla, Turma), com vagas em
  tempo real.
- Reserva, cancela e remarca aulas. Cancelamento e remarcação só até 2 horas
  antes; a remarcação é para outro horário da mesma modalidade.
- Recebe confirmação por e-mail a cada reserva, cancelamento ou remarcação.

**Gestão do estúdio**
- Agenda do dia com lotação de cada aula e a lista de inscritos.
- Indicadores do dia: aulas, alunos confirmados e ocupação.
- Cria aulas avulsas e cancela aulas. Ao cancelar, cada inscrito recebe um aviso
  por e-mail.

**Contas de demonstração:** na página inicial há "Entrar como aluno" e "Entrar
como gestão do estúdio", para testar sem cadastro.

## Como é feito

- **Next.js 16** (App Router, Server Components e Server Actions), TypeScript e
  Tailwind CSS.
- **Supabase:** Postgres e autenticação. A sessão fica em cookies (`@supabase/ssr`)
  e é renovada em `src/proxy.ts`.
- **Resend:** e-mails de confirmação, enviados com `after()` para não atrasar a
  resposta.
- **Zod:** validação dos formulários no servidor.

### Regras no banco de dados

As regras de negócio ficam em funções do Postgres
(`supabase/migrations/0002_functions.sql`), não na interface:

- `book_session` trava a aula (`select … for update`) antes de contar as vagas.
  Duas reservas simultâneas para a última vaga não passam juntas.
- `cancel_booking` e `reschedule_booking` aplicam a antecedência mínima de 2
  horas e conferem se a reserva é de quem está pedindo.
- `create_session` e `cancel_session` só funcionam para o perfil de gestão.
- **Row Level Security:** cada aluno só lê as próprias reservas. Não existem
  políticas de escrita direta; toda alteração passa pelas funções.
- As aulas são geradas a partir da grade semanal (`ensure_upcoming_sessions`),
  então a agenda nunca fica vazia.

## Rodando localmente

Requisitos: Node.js 20.9+ e um projeto no [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local   # preencha com os dados do seu projeto
npm run db:migrate           # cria tabelas, funções e regras de segurança
npm run db:seed              # contas de demonstração, aulas e reservas fictícias
npm run dev
```

As variáveis estão descritas em `.env.example`. Sem `RESEND_API_KEY`, o app
funciona normalmente e só não envia e-mails.

### Sobre os e-mails na demonstração

Sem um domínio próprio verificado no Resend, os e-mails só podem ser entregues
ao endereço da conta do Resend. Por isso existe `EMAIL_TEST_RECIPIENT`: todos os
e-mails vão para esse endereço, com o destinatário original no assunto.

## Estrutura

```
src/
  app/
    page.tsx                  página inicial e acesso de demonstração
    entrar/, cadastro/        autenticação
    esqueci-senha/, redefinir-senha/, auth/confirmar/   nova senha por e-mail
    auth-actions.ts           entrar, criar conta, sair
    password-actions.ts       pedir link e salvar nova senha
    (app)/                    área logada
      agenda/                 horários e reserva
      minhas-reservas/        cancelar e remarcar
      gestao/                 painel do estúdio
      actions.ts              ações de reserva e gestão
  lib/                        Supabase, e-mail, datas, mensagens
  proxy.ts                    renovação de sessão e proteção de rotas
supabase/migrations/          esquema, funções e dados fixos
scripts/db.mjs                migrações e dados de demonstração
```
