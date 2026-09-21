import Link from "next/link";
import { redirect } from "next/navigation";

import { signInDemo } from "@/app/auth-actions";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth";
import { author, services, studio } from "@/lib/studio";

const steps = [
  { title: "Escolha a aula", text: "Veja os horários da semana por modalidade e as vagas disponíveis em tempo real." },
  { title: "Reserve em um clique", text: "A vaga fica garantida na hora e a confirmação chega por e-mail." },
  { title: "Mude de planos sem ligar", text: `Cancele ou remarque até ${studio.changeDeadlineHours} horas antes, direto em Minhas reservas.` },
];

export default async function Home() {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));

  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/entrar" className={btnSecondary}>
            Entrar
          </Link>
          <Link href="/cadastro" className={`${btnPrimary} hidden sm:inline-flex`}>
            Criar conta
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="text-sm font-semibold text-brand">Studio de pilates · {studio.city}</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Sua aula de pilates, reservada em poucos cliques.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Horários, vagas e reservas em um só lugar. Sem mensagens soltas, sem planilha: o estúdio acompanha tudo em
              um painel de gestão.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className={btnPrimary}>
                Criar conta e reservar
              </Link>
              <Link href="/entrar" className={btnSecondary}>
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className={`${card} p-6 sm:p-7`}>
            <h2 className="text-lg font-semibold">Teste sem se cadastrar</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Entre com uma conta de demonstração e experimente os dois lados do sistema.
            </p>
            <div className="mt-5 grid gap-3">
              <form action={signInDemo.bind(null, "student")}>
                <SubmitButton className={`${btnPrimary} w-full`} pendingLabel="Entrando…">
                  Entrar como aluno
                </SubmitButton>
              </form>
              <form action={signInDemo.bind(null, "manager")}>
                <SubmitButton className={`${btnSecondary} w-full`} pendingLabel="Entrando…">
                  Entrar como gestão do estúdio
                </SubmitButton>
              </form>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Os e-mails de confirmação das contas de demonstração não chegam a nenhuma caixa real.
            </p>
          </div>
        </section>

        <section aria-labelledby="modalidades" className="py-8">
          <h2 id="modalidades" className="text-2xl font-bold tracking-tight">
            Modalidades
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className={`${card} p-5`}>
                <h3 className="font-semibold">{service.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
                <p className="mt-4 text-sm font-medium">
                  {service.duration} min · até {service.capacity} {service.capacity === 1 ? "pessoa" : "pessoas"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="como-funciona" className="py-8">
          <h2 id="como-funciona" className="text-2xl font-bold tracking-tight">
            Como funciona
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className={`${card} p-5`}>
                <span className="text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-8">
          <p>Nexo Agenda · estúdio fictício para demonstração</p>
          <a href={author.repository} target="_blank" rel="noreferrer" className="font-medium text-brand underline underline-offset-2">
            Ver o código no GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
