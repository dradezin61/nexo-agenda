import { createClient } from "@/lib/supabase/server";

export type UpcomingSession = {
  id: string;
  service_id: number;
  service_slug: string;
  service_name: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  booked: number;
  instructor: string;
  booked_by_me: boolean;
};

/** Garante as aulas das próximas semanas e devolve as dos próximos `days` dias com as vagas. */
export async function loadUpcomingSessions(days = 7) {
  const supabase = await createClient();
  await supabase.rpc("ensure_upcoming_sessions", { p_days: 21 });
  const { data, error } = await supabase.rpc("list_upcoming_sessions", { p_days: days });
  if (error) throw new Error(`Não foi possível carregar a agenda: ${error.message}`);
  return (data ?? []) as UpcomingSession[];
}
