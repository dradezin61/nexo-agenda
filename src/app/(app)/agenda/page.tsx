import type { Metadata } from "next";
import Link from "next/link";

import { bookSession } from "@/app/(app)/actions";
import { DayTabs } from "@/components/day-tabs";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, card } from "@/components/ui";
import { dateKey, formatDayLong, formatTime, keyToDate, upcomingDayKeys } from "@/lib/format";
import { loadUpcomingSessions } from "@/lib/sessions";
import { services } from "@/lib/studio";

export const metadata: Metadata = { title: "Agenda" };

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const query = await searchParams;
  const days = upcomingDayKeys(7);
  const day = days.includes(param(query.dia) ?? "") ? param(query.dia)! : days[0];
  const modality = services.find((s) => s.slug === param(query.modalidade))?.slug;

  const sessions = (await loadUpcomingSessions(7)).filter(
    (s) => dateKey(s.starts_at) === day && (!modality || s.service_slug === modality),
  );

  const href = (next: { dia?: string; modalidade?: string | null }) => {
    const params = new URLSearchParams();
    params.set("dia", next.dia ?? day);
    const m = next.modalidade === undefined ? modality : next.modalidade;
    if (m) params.set("modalidade", m);
    return `/agenda?${params}`;
  };
  const returnTo = href({});

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Agenda</h1>
        <p className="mt-1 text-muted">Escolha o dia e a modalidade para ver os horários com vaga.</p>
      </div>

      <Flash ok={param(query.ok)} erro={param(query.erro)} />

      <DayTabs days={days} selected={day} hrefFor={(d) => href({ dia: d })} />

      <nav aria-label="Filtrar por modalidade" className="flex flex-wrap gap-2">
        {[{ slug: null, name: "Todas" }, ...services].map((s) => {
          const active = (s.slug ?? undefined) === modality;
          return (
            <Link
              key={s.name}
              href={href({ modalidade: s.slug })}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active ? "border-brand bg-brand-soft text-brand-strong" : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {s.name}
            </Link>
          );
        })}
      </nav>

      <section aria-label={`Aulas de ${formatDayLong(keyToDate(day))}`} className="grid gap-3">
        <h2 className="text-lg font-semibold">{formatDayLong(keyToDate(day))}</h2>
        {sessions.length === 0 ? (
          <p className={`${card} p-6 text-muted`}>Nenhuma aula com esses filtros neste dia. Experimente outro dia ou modalidade.</p>
        ) : (
          sessions.map((session) => {
            const free = session.capacity - session.booked;
            const full = free <= 0;
            return (
              <article key={session.id} className={`${card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
                <div className="flex items-center gap-4">
                  <p className="w-16 text-xl font-bold tabular-nums">{formatTime(session.starts_at)}</p>
                  <div>
                    <h3 className="font-semibold">{session.service_name}</h3>
                    <p className="text-sm text-muted">
                      {session.instructor} · {session.duration_minutes} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className={`text-sm font-medium ${full ? "text-danger" : "text-muted"}`}>
                    {session.booked_by_me ? "Você está inscrito" : full ? "Lotada" : `${free} ${free === 1 ? "vaga livre" : "vagas livres"} de ${session.capacity}`}
                  </p>
                  {session.booked_by_me ? (
                    <Link href="/minhas-reservas" className="text-sm font-semibold text-brand underline underline-offset-2">
                      Ver reserva
                    </Link>
                  ) : (
                    <form action={bookSession}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton className={btnPrimary} disabled={full} pendingLabel="Reservando…">
                        Reservar
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
