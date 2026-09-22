import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { rescheduleBooking } from "@/app/(app)/actions";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { canChange, dateKey, formatDateTime, formatDayLong, formatTime } from "@/lib/format";
import { loadUpcomingSessions } from "@/lib/sessions";
import { studio } from "@/lib/studio";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Remarcar aula" };

type Booking = {
  id: string;
  status: string;
  session_id: string;
  class_sessions: { starts_at: string; service_id: number; services: { name: string } | null } | null;
};

export default async function ReschedulePage({ params, searchParams }: PageProps<"/minhas-reservas/[id]/remarcar">) {
  const viewer = await requireViewer();
  const { id } = await params;
  const { erro } = await searchParams;

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, session_id, class_sessions(starts_at, service_id, services(name))")
    .eq("id", id)
    .eq("user_id", viewer.id)
    .maybeSingle<Booking>();
  if (!booking?.class_sessions || booking.status !== "confirmed") notFound();

  const current = booking.class_sessions;
  const changeable = canChange(current.starts_at);
  const options = changeable
    ? (await loadUpcomingSessions(14)).filter(
        (s) => s.service_id === current.service_id && s.id !== booking.session_id && !s.booked_by_me && s.booked < s.capacity,
      )
    : [];

  const byDay = new Map<string, typeof options>();
  for (const option of options) {
    const key = dateKey(option.starts_at);
    byDay.set(key, [...(byDay.get(key) ?? []), option]);
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/minhas-reservas" className="text-sm font-semibold text-brand underline underline-offset-2">
          ← Minhas reservas
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Remarcar aula</h1>
        <p className="mt-1 text-muted">
          Atual: {current.services?.name}, {formatDateTime(current.starts_at)}
        </p>
      </div>

      <Flash erro={typeof erro === "string" ? erro : undefined} />

      {!changeable ? (
        <p className={`${card} p-6 text-muted`}>
          Faltam menos de {studio.changeDeadlineHours} horas para essa aula, então não é mais possível remarcar.
        </p>
      ) : options.length === 0 ? (
        <p className={`${card} p-6 text-muted`}>
          Não há outros horários de {current.services?.name} com vaga nas próximas duas semanas.
        </p>
      ) : (
        <div className="grid gap-5">
          <p className="text-muted">Escolha o novo horário (mesma modalidade, próximas duas semanas):</p>
          {[...byDay.entries()].map(([day, list]) => (
            <section key={day} className="grid gap-2">
              <h2 className="font-semibold">{formatDayLong(list[0].starts_at)}</h2>
              <div className="flex flex-wrap gap-2">
                {list.map((option) => (
                  <form key={option.id} action={rescheduleBooking}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="sessionId" value={option.id} />
                    <SubmitButton className={btnSecondary} pendingLabel="Remarcando…">
                      <span className="tabular-nums">{formatTime(option.starts_at)}</span>
                      <span className="font-normal text-muted">· {option.instructor}</span>
                    </SubmitButton>
                  </form>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div>
        <Link href="/agenda" className={btnPrimary}>
          Ver agenda completa
        </Link>
      </div>
    </div>
  );
}
