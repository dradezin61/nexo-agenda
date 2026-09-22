import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUp } from "@/app/auth-actions";
import { Flash } from "@/components/flash";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { card, input, label } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage({ searchParams }: PageProps<"/cadastro">) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10">
      <Logo />
      <div className={`${card} mt-8 p-6 sm:p-8`}>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted">Leva menos de um minuto e você já pode reservar.</p>
        <div className="mt-4">
          <Flash erro={typeof erro === "string" ? erro : undefined} />
        </div>

        <form action={signUp} className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="fullName" className={label}>Nome</label>
            <input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={80} className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="email" className={label}>E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className={label}>Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              aria-describedby="password-hint"
              className={input}
            />
            <p id="password-hint" className="text-xs text-muted">Pelo menos 8 caracteres.</p>
          </div>
          <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>
        </form>

        <p className="mt-5 text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-brand underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
