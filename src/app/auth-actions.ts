"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { homeFor } from "@/lib/auth";
import { demoAccounts } from "@/lib/studio";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
});

const signUpSchema = credentials.extend({
  fullName: z.string().trim().min(2).max(80),
});

async function signInAndGo(email: string, password: string, errorTarget: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect(`${errorTarget}?erro=credenciais`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: "student" | "manager" }>();
  redirect(homeFor({ role: profile?.role ?? "student" }));
}

export async function signIn(formData: FormData) {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/entrar?erro=credenciais");
  await signInAndGo(parsed.data.email, parsed.data.password, "/entrar");
}

/**
 * Conta de teste pública: só a de aluno. O acesso de gestão não é oferecido
 * publicamente porque a gestão enxerga os cadastros e as reservas de todos —
 * o papel dessa conta também foi revogado no banco.
 */
export async function signInDemo() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) redirect("/entrar?erro=demo_indisponivel");
  await signInAndGo(demoAccounts.student, password, "/entrar");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/cadastro?erro=dados_invalidos");
  const { fullName, email, password } = parsed.data;

  // Conta criada já confirmada: sem domínio próprio, o e-mail de ativação do
  // Supabase não chegaria a visitantes da demonstração.
  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  const alreadyExists = error?.code === "email_exists" || error?.code === "user_already_exists";
  if (error && !alreadyExists) {
    redirect(`/cadastro?erro=${error.code === "weak_password" ? "senha_fraca" : "erro_inesperado"}`);
  }

  // Se a conta já existe (por exemplo, o formulário foi enviado duas vezes e a
  // primeira tentativa já a criou), a senha certa simplesmente faz o login.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect(`/cadastro?erro=${alreadyExists ? "email_em_uso" : "erro_inesperado"}`);
  redirect("/agenda?ok=bem_vindo");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
