import Link from "next/link";

import { formatDayShort, keyToDate } from "@/lib/format";

type DayTabsProps = {
  days: string[];
  selected: string;
  hrefFor: (day: string) => string;
};

export function DayTabs({ days, selected, hrefFor }: DayTabsProps) {
  return (
    <nav aria-label="Escolher o dia" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {days.map((day, index) => {
        const active = day === selected;
        return (
          <Link
            key={day}
            href={hrefFor(day)}
            aria-current={active ? "date" : undefined}
            className={`flex min-w-20 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              active ? "border-brand bg-brand text-white" : "border-border bg-surface hover:bg-surface-muted"
            }`}
          >
            <span className="font-semibold capitalize">{index === 0 ? "Hoje" : formatDayShort(keyToDate(day)).split(",")[0]}</span>
            <span className={`whitespace-nowrap ${active ? "text-white/85" : "text-muted"}`}>{formatDayShort(keyToDate(day)).split(",")[1]?.trim()}</span>
          </Link>
        );
      })}
    </nav>
  );
}
