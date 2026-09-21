import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-md text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-lg bg-brand text-sm text-white">
        N
      </span>
      Nexo <span className="font-medium text-muted">Agenda</span>
    </Link>
  );
}
