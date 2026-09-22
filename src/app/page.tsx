import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInDemo } from "@/app/auth-actions";
import { Logo } from "@/components/logo";
import { ServiceIcon } from "@/components/service-icon";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth";
import { author, services, studio } from "@/lib/studio";

const steps = [
  { title: "Escolha a aula", text: "Veja os horários da semana por modalidade e as vagas disponíveis em tempo real." },
  { title: "Reserve em um clique", text: "A vaga fica garantida na hora e aparece em Minhas reservas." },
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
          {/* Envolvido para esconder no celular: a classe de display do botão venceria um `hidden` solto. */}
          <span className="hidden sm:block">
            <Link href="/cadastro" className={btnPrimary}>
              Criar conta
            </Link>
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">{studio.tagline}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Movimento, equilíbrio e tempo para você.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Encontre sua aula de pilates, escolha o melhor horário e reserve seu momento de cuidado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className={btnPrimary}>
                Agendar minha aula
              </Link>
              <Link href="/entrar" className={btnSecondary}>
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <Image
              src="/estudio-pilates.png"
              alt="Cena ilustrativa de uma aula de pilates no Reformer, acompanhada por uma instrutora."
              width={928}
              height={1152}
              sizes="(min-width: 1024px) 460px, (min-width: 640px) 520px, 100vw"
              priority
              className="aspect-4/5 w-full rounded-xl object-cover"
            />
          </div>
        </section>

        <section aria-labelledby="conta-de-teste" className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
          <div className="max-w-md">
            <h2 id="conta-de-teste" className="font-semibold">
              Conhecer sem se cadastrar
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Entre com uma conta de teste e percorra a agenda, as reservas e a remarcação.
            </p>
          </div>
          <form action={signInDemo} className="sm:shrink-0">
            <SubmitButton className={`${btnSecondary} w-full sm:w-auto`} pendingLabel="Entrando…">
              Entrar com conta de teste
            </SubmitButton>
          </form>
        </section>

        <section aria-labelledby="modalidades" className="py-12">
          <h2 id="modalidades" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Modalidades
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className={`${card} flex flex-col p-5`}>
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <ServiceIcon slug={service.slug} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{service.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{service.description}</p>
                <p className="mt-4 border-t border-border pt-3 text-sm font-medium">
                  {service.duration} min · até {service.capacity} {service.capacity === 1 ? "pessoa" : "pessoas"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="como-funciona" className="pb-4">
          <h2 id="como-funciona" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
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
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-medium text-foreground">
            {studio.name} · {studio.tagline}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={author.portfolio} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              Desenvolvido por {author.name}
            </a>
            <a href={author.repository} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
