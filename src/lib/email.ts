import { Resend } from "resend";

import { formatDateTime } from "@/lib/format";
import { author } from "@/lib/studio";

type Message = { to: string; subject: string; heading: string; lines: string[] };

/**
 * Envia pelo Resend. Sem domínio próprio verificado, o Resend só entrega para o
 * e-mail da conta; EMAIL_TEST_RECIPIENT redireciona tudo para lá, mantendo o
 * destinatário original no assunto. Falhas são registradas e não quebram a ação.
 */
async function send({ to, subject, heading, lines }: Message) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY ausente; e-mail não enviado: ${subject}`);
    return;
  }

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
  const recipient = testRecipient || to;
  const finalSubject = testRecipient && testRecipient !== to ? `${subject} [para ${to}]` : subject;

  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.EMAIL_FROM || "Nexo Agenda <onboarding@resend.dev>",
    to: recipient,
    subject: finalSubject,
    html: render(heading, lines),
    text: [heading, "", ...lines, "", footerText].join("\n"),
  });

  if (error) console.error(`[email] falha ao enviar "${subject}" para ${recipient}: ${error.message}`);
}

const footerText = `Nexo é um estúdio fictício. Projeto de demonstração de ${author.name}: ${author.portfolio}`;

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function render(heading: string, lines: string[]) {
  const body = lines.map((line) => `<p style="margin:0 0 12px;line-height:1.55">${escape(line)}</p>`).join("");
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f6f2ec;font-family:Arial,sans-serif;color:#1e2b27">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-weight:700;color:#2f5d50;font-size:18px">Nexo Agenda</p>
<div style="background:#ffffff;border:1px solid #e2dace;border-radius:12px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h1>${body}</div>
<p style="margin:24px 0 0;font-size:12px;color:#5c6b66;line-height:1.5">${escape(footerText)}</p>
</div></body></html>`;
}

type ClassInfo = { serviceName: string; startsAt: string; instructor: string };

export function sendBookingConfirmed(to: string, name: string, info: ClassInfo) {
  return send({
    to,
    subject: `Reserva confirmada: ${info.serviceName}, ${formatDateTime(info.startsAt)}`,
    heading: "Sua aula está reservada",
    lines: [
      `Olá, ${name}.`,
      `Aula: ${info.serviceName}, com ${info.instructor}.`,
      `Quando: ${formatDateTime(info.startsAt)}.`,
      "Se precisar, você pode cancelar ou remarcar até 2 horas antes, em Minhas reservas.",
    ],
  });
}

export function sendBookingCancelled(to: string, name: string, info: ClassInfo) {
  return send({
    to,
    subject: `Reserva cancelada: ${info.serviceName}, ${formatDateTime(info.startsAt)}`,
    heading: "Sua reserva foi cancelada",
    lines: [
      `Olá, ${name}.`,
      `Cancelamos sua reserva de ${info.serviceName}, ${formatDateTime(info.startsAt)}.`,
      "Quando quiser, é só escolher um novo horário na agenda.",
    ],
  });
}

export function sendBookingRescheduled(to: string, name: string, from: ClassInfo, target: ClassInfo) {
  return send({
    to,
    subject: `Aula remarcada para ${formatDateTime(target.startsAt)}`,
    heading: "Sua aula foi remarcada",
    lines: [
      `Olá, ${name}.`,
      `Antes: ${from.serviceName}, ${formatDateTime(from.startsAt)}.`,
      `Agora: ${target.serviceName}, ${formatDateTime(target.startsAt)}, com ${target.instructor}.`,
    ],
  });
}

export function sendSessionCancelledByStudio(to: string, name: string, info: ClassInfo) {
  return send({
    to,
    subject: `Aula cancelada pelo estúdio: ${info.serviceName}, ${formatDateTime(info.startsAt)}`,
    heading: "O estúdio cancelou uma aula sua",
    lines: [
      `Olá, ${name}.`,
      `A aula de ${info.serviceName}, ${formatDateTime(info.startsAt)}, foi cancelada pelo estúdio e sua reserva foi desfeita.`,
      "Pedimos desculpas pelo transtorno. Escolha outro horário na agenda quando quiser.",
    ],
  });
}
