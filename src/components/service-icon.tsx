/** Pictogramas lineares das modalidades: uma pessoa, duas e um grupo. */
const paths: Record<string, React.ReactNode> = {
  solo: (
    <>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </>
  ),
  dupla: (
    <>
      <circle cx="8.5" cy="7.5" r="2.8" />
      <circle cx="16.5" cy="7.5" r="2.8" />
      <path d="M2.8 20.3c0-3.1 2.5-5.7 5.7-5.7 1.3 0 2.6.5 3.5 1.2" />
      <path d="M12 15.8c1-.8 2.2-1.2 3.5-1.2 3.2 0 5.7 2.6 5.7 5.7" />
    </>
  ),
  turma: (
    <>
      <circle cx="12" cy="7" r="2.8" />
      <circle cx="4.8" cy="10" r="2.2" />
      <circle cx="19.2" cy="10" r="2.2" />
      <path d="M6.5 20.4c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <path d="M1.8 19.2c0-2.2 1.4-4 3.4-4.5" />
      <path d="M22.2 19.2c0-2.2-1.4-4-3.4-4.5" />
    </>
  ),
};

export function ServiceIcon({ slug, className = "size-7" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[slug] ?? paths.solo}
    </svg>
  );
}
