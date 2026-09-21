import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexo Agenda — agendamento de aulas de pilates",
    template: "%s · Nexo Agenda",
  },
  description:
    "Projeto de demonstração: sistema de agendamento para um estúdio fictício de pilates, com reservas, remarcações, painel de gestão e confirmações por e-mail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
