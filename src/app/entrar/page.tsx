import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn, signInDemo } from "@/app/auth-actions";
import { Flash } from "@/components/flash";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { btnSecondary, card, input, label } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10">
      <Logo />
      <div className={`${card} mt-8 p-6 sm:p-8`}>
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <div className="mt-4">
          <Flash erro={typeof erro === "string" ? erro : undefined} />
        </div>

        <form action={signIn} className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="email" className={label}>E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className={label}>Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className={input} />
          </div>
          <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
        </form>

        <p className="mt-5 text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-brand underline underline-offset-2">
            Criar conta
          </Link>
        </p>
      </div>

      <div className={`${card} mt-4 p-6`}>
        <h2 className="font-semibold">Só quer conhecer o sistema?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <form action={signInDemo.bind(null, "student")}>
            <SubmitButton className={`${btnSecondary} w-full`} pendingLabel="Entrando…">
              Demonstração: aluno
            </SubmitButton>
          </form>
          <form action={signInDemo.bind(null, "manager")}>
            <SubmitButton className={`${btnSecondary} w-full`} pendingLabel="Entrando…">
              Demonstração: gestão
            </SubmitButton>
          </form>
        </div>
      </div>
    </main>
  );
}
