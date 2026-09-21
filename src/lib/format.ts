import { studio } from "@/lib/studio";

const tz = studio.timeZone;

const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
const dayShortFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "short", day: "2-digit", month: "short" });
const dayLongFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatTime = (value: string | Date) => timeFormat.format(new Date(value));
export const formatDayShort = (value: string | Date) => dayShortFormat.format(new Date(value)).replaceAll(".", "");
const capitalizeFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Terça-feira, 22 de setembro": só a primeira letra maiúscula. */
export const formatDayLong = (value: string | Date) => capitalizeFirst(dayLongFormat.format(new Date(value)));
export const formatDateTime = (value: string | Date) => `${formatDayLong(value)}, às ${formatTime(value)}`;

/** Data no formato AAAA-MM-DD, no fuso do estúdio. */
export const dateKey = (value: string | Date) => keyFormat.format(new Date(value));

/** Os próximos `count` dias (a partir de hoje) como chaves AAAA-MM-DD. */
export function upcomingDayKeys(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => dateKey(new Date(now + i * 86_400_000)));
}

/** Meio-dia da data em São Paulo: evita que o fuso mude o dia ao formatar. */
export const keyToDate = (key: string) => new Date(`${key}T12:00:00-03:00`);

export function canChange(startsAt: string) {
  return new Date(startsAt).getTime() - Date.now() >= studio.changeDeadlineHours * 3_600_000;
}

/** A aula ainda não começou. */
export const isFuture = (startsAt: string) => new Date(startsAt).getTime() > Date.now();
