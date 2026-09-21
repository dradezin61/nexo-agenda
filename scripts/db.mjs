// Prepara o banco do Supabase a partir do .env.local.
//   node scripts/db.mjs migrate  -> aplica supabase/migrations na ordem, uma vez cada
//   node scripts/db.mjs seed     -> contas de demonstração, aulas e reservas fictícias
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const required = ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "DEMO_PASSWORD"];
const missing = required.filter((name) => !process.env[name] || process.env[name].includes("COLE_AQUI"));
if (missing.length) {
  console.error(`Faltam valores no .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEMO_USERS = [
  { email: "aluno.demo@example.com", fullName: "Aluno Demonstração", role: "student", demo: true },
  { email: "gestor.demo@example.com", fullName: "Gestão Demonstração", role: "manager", demo: true },
];

const FICTIONAL_STUDENTS = [
  "Ana Ribeiro", "Bruno Carvalho", "Carla Mendes", "Diego Nunes",
  "Elisa Prado", "Felipe Rocha", "Gabriela Souza", "Henrique Dias",
].map((fullName) => ({
  fullName,
  email: `${fullName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".")}@example.com`,
  role: "student",
  demo: false,
}));

async function migrate() {
  await db.query("create schema if not exists app_private");
  await db.query(
    "create table if not exists app_private.migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set((await db.query("select name from app_private.migrations")).rows.map((r) => r.name));
  const dir = join("supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  já aplicada  ${file}`);
      continue;
    }
    await db.query("begin");
    try {
      await db.query(readFileSync(join(dir, file), "utf8"));
      await db.query("insert into app_private.migrations (name) values ($1)", [file]);
      await db.query("commit");
      console.log(`  aplicada     ${file}`);
    } catch (error) {
      await db.query("rollback");
      throw new Error(`Falha em ${file}: ${error.message}`);
    }
  }
}

async function ensureUser(admin, user, password) {
  const created = await admin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  });
  let id = created.data.user?.id;

  if (!id) {
    const existing = await db.query("select id from auth.users where email = $1", [user.email]);
    id = existing.rows[0]?.id;
    if (!id) throw new Error(`Não foi possível criar ${user.email}: ${created.error?.message}`);
    if (user.demo) await admin.auth.admin.updateUserById(id, { password });
  }

  await db.query("update public.profiles set full_name = $2, role = $3 where id = $1", [id, user.fullName, user.role]);
  return id;
}

async function seed() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ids = {};
  for (const user of DEMO_USERS) {
    ids[user.email] = await ensureUser(admin, user, process.env.DEMO_PASSWORD);
    console.log(`  conta demo   ${user.email} (${user.role === "manager" ? "gestão" : "aluno"})`);
  }
  const fictional = [];
  for (const user of FICTIONAL_STUDENTS) {
    fictional.push(await ensureUser(admin, user, crypto.randomUUID()));
  }
  console.log(`  alunos fictícios: ${fictional.length}`);

  const generated = await db.query("select public.ensure_upcoming_sessions(21) as n");
  console.log(`  aulas geradas agora: ${generated.rows[0].n}`);

  // Ocupa parte das aulas das próximas duas semanas com os alunos fictícios.
  const sessions = (
    await db.query(
      `select id, capacity from public.class_sessions
        where status = 'scheduled' and starts_at > now() and starts_at < now() + interval '14 days'
        order by starts_at`,
    )
  ).rows;

  let bookings = 0;
  for (const [index, session] of sessions.entries()) {
    const target = session.capacity === 1 ? index % 3 === 0 ? 1 : 0 : Math.floor(session.capacity * (0.3 + ((index * 37) % 50) / 100));
    for (let i = 0; i < Math.min(target, fictional.length); i++) {
      const userId = fictional[(index + i) % fictional.length];
      const result = await db.query(
        `insert into public.bookings (session_id, user_id) values ($1, $2)
         on conflict (session_id, user_id) where status = 'confirmed' do nothing`,
        [session.id, userId],
      );
      bookings += result.rowCount;
    }
  }
  console.log(`  reservas fictícias criadas: ${bookings}`);

  // Duas reservas para o aluno de demonstração, para "Minhas reservas" não começar vazia.
  const studentId = ids["aluno.demo@example.com"];
  const hasBookings = await db.query(
    "select 1 from public.bookings where user_id = $1 and status = 'confirmed' limit 1",
    [studentId],
  );
  if (!hasBookings.rowCount) {
    const picks = await db.query(
      `select cs.id from public.class_sessions cs
        where cs.status = 'scheduled' and cs.service_id = 3 and cs.starts_at > now() + interval '1 day'
          and (select count(*) from public.bookings b where b.session_id = cs.id and b.status = 'confirmed') < cs.capacity
        order by cs.starts_at limit 2`,
    );
    for (const row of picks.rows) {
      await db.query("insert into public.bookings (session_id, user_id) values ($1, $2)", [row.id, studentId]);
    }
    console.log(`  reservas do aluno demo: ${picks.rowCount}`);
  }
}

const command = process.argv[2];
if (!["migrate", "seed"].includes(command)) {
  console.error("Use: node scripts/db.mjs migrate | seed");
  process.exit(1);
}

await db.connect();
try {
  console.log(command === "migrate" ? "Aplicando migrações..." : "Preparando dados de demonstração...");
  await (command === "migrate" ? migrate() : seed());
  console.log("Pronto.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
