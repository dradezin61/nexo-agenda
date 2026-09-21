import type { Metadata } from "next";
import Link from "next/link";

import { cancelBooking } from "@/app/(app)/actions";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger, btnPrimary, btnSecondary, card } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { canChange, formatDateTime, isFuture } from "@/lib/format";
import { studio } from "@/lib/studio";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Minhas reservas" };

type BookingRow = {
  id: string;
  status: "confirmed" | "cancelled";
  class_sessions: {
    starts_at: string;
    instructor: string;
    status: string;
    services: { name: string; duration_minutes: number } | null;
  } | null;
};

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export default async function MyBookingsPage({ searchParams }: PageProps<"/minhas-reservas">) {
  const viewer = await requireViewer();
  const query = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, status, class_sessions(starts_at, instructor, status, services(name, duration_minutes))")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<BookingRow[]>();

  const rows = (data ?? []).filter((row) => row.class_sessions);
  const upcoming = rows
    .filter((r) => r.status === "confirmed" && isFuture(r.class_sessions!.starts_at))
    .sort((a, b) => a.class_sessions!.starts_at.localeCompare(b.class_sessions!.starts_at));
  const history = rows.filter((r) => !upcoming.includes(r)).slice(0, 10);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Minhas reservas</h1>
        <p className="mt-1 text-muted">
          Você pode cancelar ou remarcar até {studio.changeDeadlineHours} horas antes da aula.
        </p>
      </div>

      <Flash ok={param(query.ok)} erro={param(query.erro)} />

      <section aria-labelledby="proximas" className="grid gap-3">
        <h2 id="proximas" className="text-lg font-semibold">
          Próximas aulas
        </h2>
        {upcoming.length === 0 ? (
          <div className={`${card} p-6`}>
            <p className="text-muted">Você não tem aulas reservadas.</p>
            <Link href="/agenda" className={`${btnPrimary} mt-4`}>
              Ver horários
            </Link>
          </div>
        ) : (
          upcoming.map((row) => {
            const session = row.class_sessions!;
            const changeable = canChange(session.starts_at);
            return (
              <article key={row.id} className={`${card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
                <div>
                  <h3 className="font-semibold">{session.services?.name}</h3>
                  <p className="text-sm capitalize text-muted">{formatDateTime(session.starts_at)}</p>
                  <p className="text-sm text-muted">com {session.instructor}</p>
                </div>
                {changeable ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/minhas-reservas/${row.id}/remarcar`} className={btnSecondary}>
                      Remarcar
                    </Link>
                    <form action={cancelBooking}>
                      <input type="hidden" name="bookingId" value={row.id} />
                      <input type="hidden" name="returnTo" value="/minhas-reservas" />
                      <SubmitButton className={btnDanger} pendingLabel="Cancelando…">
                        Cancelar
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <p className="max-w-56 text-sm text-muted">
                    Faltam menos de {studio.changeDeadlineHours} horas: não é mais possível cancelar ou remarcar.
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>

      {history.length > 0 ? (
        <section aria-labelledby="historico" className="grid gap-3">
          <h2 id="historico" className="text-lg font-semibold">
            Histórico recente
          </h2>
          <ul className={`${card} divide-y divide-border`}>
            {history.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
                <span>
                  <span className="font-medium">{row.class_sessions!.services?.name}</span>
                  <span className="text-muted"> · {formatDateTime(row.class_sessions!.starts_at)}</span>
                </span>
                <span className={row.status === "cancelled" ? "text-danger" : "text-muted"}>
                  {row.status === "cancelled" ? "Cancelada" : "Realizada"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
