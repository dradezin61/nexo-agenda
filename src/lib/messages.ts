const success = {
  reservado: "Reserva confirmada. Consulte os detalhes em Minhas reservas.",
  cancelado: "Reserva cancelada.",
  remarcado: "Aula remarcada. Confira o novo horário em Minhas reservas.",
  aula_criada: "Aula criada e disponível para reserva.",
  aula_cancelada: "Aula cancelada. As reservas dessa aula foram desfeitas.",
  bem_vindo: "Conta criada. Escolha um horário para a sua primeira aula.",
  link_enviado: "Se existir uma conta com esse e-mail, o link para criar uma nova senha segue para lá. Confira também o spam.",
  senha_alterada: "Senha alterada. Use a nova senha nos próximos acessos.",
} as const;

const errors = {
  session_full: "Essa aula acabou de lotar. Escolha outro horário.",
  session_unavailable: "Essa aula não está mais disponível.",
  session_started: "Essa aula já começou.",
  already_booked: "Você já tem reserva nessa aula.",
  too_late: "Cancelamentos e remarcações só são possíveis até 2 horas antes da aula.",
  booking_not_found: "Reserva não encontrada.",
  booking_not_active: "Essa reserva já foi cancelada.",
  same_session: "Escolha um horário diferente do atual.",
  different_service: "A remarcação precisa ser para a mesma modalidade.",
  session_in_past: "Escolha uma data e um horário no futuro.",
  session_exists: "Já existe uma aula dessa modalidade nesse horário.",
  instructor_required: "Escolha quem vai dar a aula.",
  service_not_found: "Modalidade não encontrada.",
  forbidden: "Você não tem permissão para essa ação.",
  credenciais: "E-mail ou senha incorretos.",
  email_em_uso: "Já existe uma conta com esse e-mail. Tente entrar.",
  senha_fraca: "Essa senha é muito fraca. Use pelo menos 8 caracteres, misturando letras e números.",
  dados_invalidos: "Confira os dados do formulário.",
  senhas_diferentes: "As duas senhas não são iguais. Digite a mesma senha nos dois campos.",
  mesma_senha: "A nova senha precisa ser diferente da atual.",
  link_invalido: "Esse link expirou ou já foi usado. Peça um novo abaixo.",
  demo_indisponivel: "A conta de demonstração não está disponível no momento.",
  erro_inesperado: "Algo deu errado. Tente de novo em instantes.",
} as const;

export type SuccessCode = keyof typeof success;
export type ErrorCode = keyof typeof errors;

export function successMessage(code: string | undefined) {
  return code && code in success ? success[code as SuccessCode] : null;
}

export function errorMessage(code: string | undefined) {
  if (!code) return null;
  return code in errors ? errors[code as ErrorCode] : errors.erro_inesperado;
}

/** As funções do banco lançam o código da regra violada como mensagem de erro. */
export function errorCodeFrom(error: { message?: string } | null): ErrorCode {
  const message = error?.message ?? "";
  const code = (Object.keys(errors) as ErrorCode[]).find((key) => message.includes(key));
  return code ?? "erro_inesperado";
}
