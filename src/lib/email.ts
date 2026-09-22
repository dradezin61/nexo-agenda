import { Resend } from "resend";

import { formatDateTime } from "@/lib/format";
import { author } from "@/lib/studio";

type Message = { to: string; subject: string; heading: string; lines: string[] };

/** "Nexo Agenda <contato@exemplo.com>" separado em nome e endereço. */
function sender() {
  const raw = process.env.EMAIL_FROM?.trim() || "Nexo Agenda <onboarding@resend.dev>";
  const parts = raw.match(/^(.*?)\s*<([^>]+)>$/);
  return { name: parts?.[1]?.trim() || "Nexo Agenda", email: (parts?.[2] ?? raw).trim() };
}

/**
 * Escolhe o provedor pela chave que estiver configurada. O Brevo entrega no
 * e-mail de quem se cadastrou, bastando um remetente verificado. O Resend exige
 * domínio próprio: sem ele, só entrega no endereço da conta, então
 * EMAIL_TEST_RECIPIENT redireciona tudo para lá com o destinatário no assunto.
 * Falhas são registradas e não quebram a ação em andamento.
 */
async function send(message: Message) {
  if (process.env.BREVO_API_KEY) return sendWithBrevo(message);
  if (process.env.RESEND_API_KEY) return sendWithResend(message);
  console.warn(`[email] nenhuma chave de envio configurada; e-mail não enviado: ${message.subject}`);
}

async function sendWithBrevo({ to, subject, heading, lines }: Message) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: sender(),
      to: [{ email: to }],
      subject,
      htmlContent: render(heading, lines),
      textContent: [heading, "", ...lines, "", footerText].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error(`[email] Brevo recusou "${subject}" para ${to}: ${response.status} ${await response.text()}`);
  }
}

async function sendWithResend({ to, subject, heading, lines }: Message) {
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
  const recipient = testRecipient || to;
  const finalSubject = testRecipient && testRecipient !== to ? `${subject} [para ${to}]` : subject;

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
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

export function sendPasswordReset(to: string, name: string, link: string) {
  return send({
    to,
    subject: "Crie uma nova senha no Nexo Agenda",
    heading: "Redefinição de senha",
    lines: [
      `Olá, ${name}.`,
      "Recebemos um pedido para criar uma nova senha para a sua conta. Para continuar, abra o link abaixo:",
      link,
      "O link vale por 1 hora e só pode ser usado uma vez. Se não foi você quem pediu, é só ignorar este e-mail: sua senha atual continua valendo.",
    ],
  });
}
