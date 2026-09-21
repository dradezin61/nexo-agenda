// Dados do estúdio fictício usados nas telas. As modalidades espelham
// supabase/migrations/0003_seed_catalog.sql.

export const studio = {
  name: "Nexo",
  city: "São Paulo",
  timeZone: "America/Sao_Paulo",
  changeDeadlineHours: 2,
} as const;

export const services = [
  { id: 1, slug: "solo", name: "Solo", capacity: 1, duration: 50, description: "Aula individual, com atenção total do instrutor." },
  { id: 2, slug: "dupla", name: "Dupla", capacity: 2, duration: 50, description: "Para treinar em dupla, com correções individuais." },
  { id: 3, slug: "turma", name: "Turma", capacity: 8, duration: 55, description: "Aula em grupo de até 8 pessoas, no ritmo da turma." },
] as const;

export const instructors = ["Marina Costa", "Rafael Lima", "Júlia Alves"] as const;

export const demoAccounts = {
  student: "aluno.demo@example.com",
  manager: "gestor.demo@example.com",
} as const;

export const author = {
  name: "Gabriel Andrade",
  portfolio: "https://gabriel-andrade-omega.vercel.app/",
  repository: "https://github.com/dradezin61/nexo-agenda",
} as const;
