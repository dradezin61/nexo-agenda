import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { studio } from "@/lib/studio";

/** Marca tipográfica: símbolo + nome em Lora, com o complemento menor. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <BrandMark className="size-9 shrink-0" />
      <span className="grid">
        <span className="font-display text-xl font-semibold leading-none tracking-tight text-foreground">
          {studio.name}
        </span>
        <span className="mt-1 whitespace-nowrap text-[0.625rem] font-semibold uppercase leading-none tracking-[0.18em] text-muted">
          {studio.tagline}
        </span>
      </span>
    </Link>
  );
}
