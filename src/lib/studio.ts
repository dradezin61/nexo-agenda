// Dados do estúdio fictício usados nas telas. As modalidades espelham
// supabase/migrations/0003_seed_catalog.sql.

export const studio = {
  name: "Cadência",
  tagline: "Studio de Pilates",
  city: "São Paulo",
  timeZone: "America/Sao_Paulo",
  changeDeadlineHours: 2,
} as const;

export const services = [
  { id: 1, slug: "solo", name: "Solo", capacity: 1, duration: 50, description: "Atenção individual para acompanhar cada movimento." },
  { id: 2, slug: "dupla", name: "Dupla", capacity: 2, duration: 50, description: "Compartilhe a prática com acompanhamento próximo." },
  { id: 3, slug: "turma", name: "Turma", capacity: 8, duration: 55, description: "Movimento em grupo, respeitando o ritmo de cada pessoa." },
] as const;

export const instructors = ["Marina Costa", "Rafael Lima", "Júlia Alves"] as const;

/**
 * Contas de teste. Endereços de exemplo, que não existem como caixa de e-mail:
 * o app não envia nada para elas. Só a de aluno tem acesso público; a de gestão
 * ficou sem o papel de gestor no banco (ver README).
 */
export const demoAccounts = {
  student: "aluno.demo@example.com",
  manager: "gestor.demo@example.com",
} as const;

/** Identificação sempre a partir de dados do servidor, nunca de um sinal do navegador. */
export const isTestAccount = (email: string) =>
  (Object.values(demoAccounts) as string[]).includes(email.trim().toLowerCase());

export const author = {
  name: "Gabriel Andrade",
  portfolio: "https://gabriel-andrade-omega.vercel.app/",
  repository: "https://github.com/dradezin61/nexo-agenda",
} as const;
