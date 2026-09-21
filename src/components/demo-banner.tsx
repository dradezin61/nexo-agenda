import { author } from "@/lib/studio";

export function DemoBanner() {
  return (
    <div className="bg-brand-strong px-4 py-2 text-center text-xs text-white/90 sm:text-sm">
      Projeto de demonstração: o estúdio Nexo e os dados são fictícios. Desenvolvido por{" "}
      <a
        href={author.portfolio}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-white underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {author.name}
      </a>
      .
    </div>
  );
}
