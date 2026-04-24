export function isPositiveNumber(v: unknown): boolean {
  const n = parseFloat(String(v))
  return !isNaN(n) && n > 0
}

export function isNonEmpty(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

export function isValidDate(v: unknown): boolean {
  if (typeof v !== 'string' || !v) return false
  const d = new Date(v)
  return !isNaN(d.getTime())
}

export function validateEntrada(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.descricao)) return 'Descrição é obrigatória'
  if (!isPositiveNumber(form.valor)) return 'Valor deve ser maior que zero'
  if (!isValidDate(form.data)) return 'Data inválida'
  return null
}

export function validateGasto(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.descricao)) return 'Descrição é obrigatória'
  if (!isPositiveNumber(form.valor)) return 'Valor deve ser maior que zero'
  if (!isValidDate(form.data)) return 'Data inválida'
  return null
}

export function validateCartao(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.nome)) return 'Nome do cartão é obrigatório'
  if (!isPositiveNumber(form.limite)) return 'Limite deve ser maior que zero'
  return null
}

export function validateMeta(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.nome)) return 'Nome da meta é obrigatório'
  if (!isPositiveNumber(form.valorAlvo)) return 'Valor alvo deve ser maior que zero'
  return null
}

export function validateContaFixa(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.descricao)) return 'Descrição é obrigatória'
  if (!isPositiveNumber(form.valor)) return 'Valor deve ser maior que zero'
  return null
}

export function validateContaBancaria(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.nome)) return 'Nome da conta é obrigatório'
  if (form.saldo === '' || form.saldo === undefined) return 'Saldo é obrigatório'
  return null
}

export function validateDivida(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.descricao)) return 'Descrição é obrigatória'
  if (!isPositiveNumber(form.valor)) return 'Valor deve ser maior que zero'
  return null
}

export function validateParcela(form: Record<string, unknown>): string | null {
  if (!isNonEmpty(form.descricao)) return 'Descrição é obrigatória'
  if (!isPositiveNumber(form.valorMensal)) return 'Valor mensal deve ser maior que zero'
  return null
}
