import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Lora fica só na marca e em títulos de apresentação. */
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Cadência | Studio de Pilates",
    template: "%s · Cadência",
  },
  description:
    "Agende suas aulas de pilates no Cadência. Consulte horários e vagas, reserve sua aula e acompanhe seus agendamentos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${lora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
