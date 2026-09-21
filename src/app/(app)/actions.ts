"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { requireManager, requireViewer } from "@/lib/auth";
import {
  sendBookingCancelled,
  sendBookingConfirmed,
  sendBookingRescheduled,
  sendSessionCancelledByStudio,
} from "@/lib/email";
import { errorCodeFrom, type ErrorCode, type SuccessCode } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type ClassInfo = { serviceName: string; startsAt: string; instructor: string };

/** Volta para a página de origem (só caminhos internos) com a mensagem da ação. */
function back(returnTo: FormDataEntryValue | null, fallback: string, param: "ok" | "erro", code: SuccessCode | ErrorCode): never {
  const path = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
  const url = new URL(path, "http://interno");
  url.searchParams.delete("ok");
  url.searchParams.delete("erro");
  url.searchParams.set(param, code);
  redirect(`${url.pathname}${url.search}`);
}

async function classInfo(supabase: Supabase, sessionId: string): Promise<ClassInfo | null> {
  const { data } = await supabase
    .from("class_sessions")
    .select("starts_at, instructor, services(name)")
    .eq("id", sessionId)
    .single<{ starts_at: string; instructor: string; services: { name: string } | null }>();
  return data ? { serviceName: data.services?.name ?? "Aula", startsAt: data.starts_at, instructor: data.instructor } : null;
}

const uuid = z.uuid();

export async function bookSession(formData: FormData) {
  const viewer = await requireViewer();
  const returnTo = formData.get("returnTo");
  const sessionId = uuid.safeParse(formData.get("sessionId"));
  if (!sessionId.success) back(returnTo, "/agenda", "erro", "session_unavailable");

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_session", { p_session: sessionId.data });
  if (error) back(returnTo, "/agenda", "erro", errorCodeFrom(error));

  const info = await classInfo(supabase, sessionId.data);
  if (info) after(() => sendBookingConfirmed(viewer.email, viewer.fullName, info));
  revalidatePath("/", "layout");
  back(returnTo, "/agenda", "ok", "reservado");
}

export async function cancelBooking(formData: FormData) {
  const viewer = await requireViewer();
  const returnTo = formData.get("returnTo");
  const bookingId = uuid.safeParse(formData.get("bookingId"));
  if (!bookingId.success) back(returnTo, "/minhas-reservas", "erro", "booking_not_found");

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("session_id")
    .eq("id", bookingId.data)
    .single<{ session_id: string }>();

  const { error } = await supabase.rpc("cancel_booking", { p_booking: bookingId.data });
  if (error) back(returnTo, "/minhas-reservas", "erro", errorCodeFrom(error));

  const info = booking ? await classInfo(supabase, booking.session_id) : null;
  if (info) after(() => sendBookingCancelled(viewer.email, viewer.fullName, info));
  revalidatePath("/", "layout");
  back(returnTo, "/minhas-reservas", "ok", "cancelado");
}

export async function rescheduleBooking(formData: FormData) {
  const viewer = await requireViewer();
  const bookingId = uuid.safeParse(formData.get("bookingId"));
  const sessionId = uuid.safeParse(formData.get("sessionId"));
  if (!bookingId.success || !sessionId.success) back(null, "/minhas-reservas", "erro", "booking_not_found");

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("session_id")
    .eq("id", bookingId.data)
    .single<{ session_id: string }>();

  const { error } = await supabase.rpc("reschedule_booking", {
    p_booking: bookingId.data,
    p_new_session: sessionId.data,
  });
  if (error) back(`/minhas-reservas/${bookingId.data}/remarcar`, "/minhas-reservas", "erro", errorCodeFrom(error));

  const [from, target] = await Promise.all([
    booking ? classInfo(supabase, booking.session_id) : null,
    classInfo(supabase, sessionId.data),
  ]);
  if (from && target) after(() => sendBookingRescheduled(viewer.email, viewer.fullName, from, target));
  revalidatePath("/", "layout");
  back(null, "/minhas-reservas", "ok", "remarcado");
}

const newSessionSchema = z.object({
  service: z.coerce.number().int().min(1),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  instructor: z.string().trim().min(1).max(80),
});

export async function createSession(formData: FormData) {
  await requireManager();
  const returnTo = formData.get("returnTo");
  const parsed = newSessionSchema.safeParse({
    service: formData.get("service"),
    date: formData.get("date"),
    time: formData.get("time"),
    instructor: formData.get("instructor"),
  });
  if (!parsed.success) back(returnTo, "/gestao", "erro", "dados_invalidos");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_session", {
    p_service: parsed.data.service,
    p_date: parsed.data.date,
    p_time: parsed.data.time,
    p_instructor: parsed.data.instructor,
  });
  if (error) back(returnTo, "/gestao", "erro", errorCodeFrom(error));

  revalidatePath("/", "layout");
  back(`/gestao?dia=${parsed.data.date}`, "/gestao", "ok", "aula_criada");
}

export async function cancelSession(formData: FormData) {
  await requireManager();
  const returnTo = formData.get("returnTo");
  const sessionId = uuid.safeParse(formData.get("sessionId"));
  if (!sessionId.success) back(returnTo, "/gestao", "erro", "session_unavailable");

  const supabase = await createClient();
  const info = await classInfo(supabase, sessionId.data);
  const { data: affected, error } = await supabase.rpc("cancel_session", { p_session: sessionId.data });
  if (error) back(returnTo, "/gestao", "erro", errorCodeFrom(error));

  const recipients = (affected ?? []) as { email: string; full_name: string }[];
  if (info && recipients.length) {
    after(() => Promise.all(recipients.map((r) => sendSessionCancelledByStudio(r.email, r.full_name, info))));
  }
  revalidatePath("/", "layout");
  back(returnTo, "/gestao", "ok", "aula_cancelada");
}
