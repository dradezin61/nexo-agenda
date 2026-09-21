import Link from "next/link";

import { signOut } from "@/app/auth-actions";
import { Logo } from "@/components/logo";
import { SubmitButton } from "@/components/submit-button";
import { btnSecondary } from "@/components/ui";
import { homeFor, requireViewer } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const links = [
    { href: "/agenda", label: "Agenda" },
    { href: "/minhas-reservas", label: "Minhas reservas" },
    ...(viewer.role === "manager" ? [{ href: "/gestao", label: "Gestão" }] : []),
  ];

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Logo href={homeFor(viewer)} />
          <div className="flex items-center gap-3 sm:order-3">
            <p className="hidden text-sm text-muted sm:block">
              {viewer.fullName}
              {viewer.role === "manager" ? " · gestão" : ""}
            </p>
            <form action={signOut}>
              <SubmitButton className={btnSecondary} pendingLabel="Saindo…">
                Sair
              </SubmitButton>
            </form>
          </div>
          <nav aria-label="Principal" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto sm:flex-1 sm:pl-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </>
  );
}
