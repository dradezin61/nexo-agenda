import type { Metadata } from "next";

import { cancelSession, createSession } from "@/app/(app)/actions";
import { DayTabs } from "@/components/day-tabs";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger, btnPrimary, card, input, label } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { formatDayLong, formatTime, isFuture, keyToDate, upcomingDayKeys } from "@/lib/format";
import { instructors, services } from "@/lib/studio";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gestão" };

type SessionRow = {
  id: string;
  starts_at: string;
  capacity: number;
  instructor: string;
  status: "scheduled" | "cancelled";
  services: { name: string } | null;
  bookings: { status: string; profiles: { full_name: string } | null }[];
};

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export default async function ManagementPage({ searchParams }: PageProps<"/gestao">) {
  await requireManager();
  const query = await searchParams;
  const days = upcomingDayKeys(7);
  const day = days.includes(param(query.dia) ?? "") ? param(query.dia)! : days[0];

  const supabase = await createClient();
  await supabase.rpc("ensure_upcoming_sessions", { p_days: 21 });

  const start = new Date(`${day}T00:00:00-03:00`);
  const end = new Date(start.getTime() + 86_400_000);
  const { data } = await supabase
    .from("class_sessions")
    .select("id, starts_at, capacity, instructor, status, services(name), bookings(status, profiles(full_name))")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at")
    .returns<SessionRow[]>();

  const sessions = (data ?? []).map((s) => ({
    ...s,
    attendees: s.bookings.filter((b) => b.status === "confirmed").map((b) => b.profiles?.full_name ?? "Aluno"),
  }));
  const active = sessions.filter((s) => s.status === "scheduled");
  const booked = active.reduce((sum, s) => sum + s.attendees.length, 0);
  const capacity = active.reduce((sum, s) => sum + s.capacity, 0);
  const occupancy = capacity ? Math.round((booked / capacity) * 100) : 0;
  const returnTo = `/gestao?dia=${day}`;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestão do estúdio</h1>
        <p className="mt-1 text-muted">Agenda do dia, lotação das turmas e quem está inscrito.</p>
      </div>

      <Flash ok={param(query.ok)} erro={param(query.erro)} />

      <DayTabs days={days} selected={day} hrefFor={(d) => `/gestao?dia=${d}`} />

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          { term: "Aulas no dia", value: String(active.length) },
          { term: "Alunos confirmados", value: String(booked) },
          { term: "Ocupação", value: `${occupancy}%` },
        ].map((item) => (
          <div key={item.term} className={`${card} p-5`}>
            <dt className="text-sm text-muted">{item.term}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-label={`Aulas de ${formatDayLong(keyToDate(day))}`} className="grid gap-3">
        <h2 className="text-lg font-semibold">{formatDayLong(keyToDate(day))}</h2>
        {sessions.length === 0 ? (
          <p className={`${card} p-6 text-muted`}>Nenhuma aula neste dia.</p>
        ) : (
          sessions.map((session) => {
            const cancelled = session.status === "cancelled";
            const past = !isFuture(session.starts_at);
            const ratio = Math.min(100, Math.round((session.attendees.length / session.capacity) * 100));
            return (
              <article key={session.id} className={`${card} p-4 sm:p-5 ${cancelled ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="w-16 text-xl font-bold tabular-nums">{formatTime(session.starts_at)}</p>
                    <div>
                      <h3 className="font-semibold">
                        {session.services?.name}
                        {cancelled ? <span className="ml-2 text-sm font-medium text-danger">Cancelada</span> : null}
                      </h3>
                      <p className="text-sm text-muted">{session.instructor}</p>
                    </div>
                  </div>
                  <div className="min-w-40 text-right">
                    <p className="text-sm font-medium">
                      {session.attendees.length} de {session.capacity} {session.capacity === 1 ? "vaga ocupada" : "vagas ocupadas"}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-surface-muted" aria-hidden="true">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                </div>

                {session.attendees.length > 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    <span className="font-medium text-foreground">Inscritos:</span> {session.attendees.join(", ")}
                  </p>
                ) : null}

                {!cancelled && !past ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-danger">Cancelar esta aula</summary>
                    <form action={cancelSession} className="mt-3 flex flex-wrap items-center gap-3">
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <p className="text-sm text-muted">
                        {session.attendees.length > 0
                          ? `Os ${session.attendees.length} inscritos serão avisados por e-mail.`
                          : "Ninguém está inscrito ainda."}
                      </p>
                      <SubmitButton className={btnDanger} pendingLabel="Cancelando…">
                        Confirmar cancelamento
                      </SubmitButton>
                    </form>
                  </details>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      <section aria-labelledby="nova-aula" className={`${card} p-5 sm:p-6`}>
        <h2 id="nova-aula" className="text-lg font-semibold">
          Nova aula avulsa
        </h2>
        <form action={createSession} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="grid gap-1.5">
            <label htmlFor="service" className={label}>Modalidade</label>
            <select id="service" name="service" required className={input}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="date" className={label}>Data</label>
            <input id="date" name="date" type="date" required defaultValue={day} min={days[0]} className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="time" className={label}>Horário</label>
            <input id="time" name="time" type="time" required step={900} defaultValue="20:00" className={input} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="instructor" className={label}>Instrutor(a)</label>
            <select id="instructor" name="instructor" required className={input}>
              {instructors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton className={btnPrimary} pendingLabel="Criando…">
              Criar aula
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
