/**
 * Símbolo da marca: um C aberto formado por duas curvas concêntricas, que
 * sugerem movimento contínuo. Desenhado em traço para ficar legível a 16 px.
 */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none">
      <circle cx="16" cy="16" r="15" className="fill-brand-soft" />
      <path
        d="M23 9.6a9 9 0 1 0 0 12.8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="text-brand"
      />
      <path
        d="M21.2 13.6a4.6 4.6 0 1 0 0 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-accent"
      />
    </svg>
  );
}
