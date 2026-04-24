import type { Timestamp } from 'firebase/firestore'

// ─── Base ─────────────────────────────────────────────────────────────────────
export interface BaseDoc {
  id: string
  userId: string
  criadoEm?: Timestamp
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthContextType {
  user: import('firebase/auth').User | null
  loading: boolean
  login: (email: string, password: string) => Promise<import('firebase/auth').UserCredential>
  logout: () => Promise<void>
}

// ─── Entradas ─────────────────────────────────────────────────────────────────
export interface Entrada extends BaseDoc {
  descricao: string
  valor: number
  categoria: string
  data: string
  pessoa: string
  recorrente: boolean
}

export type EntradaForm = Omit<Entrada, keyof BaseDoc>

// ─── Gastos ───────────────────────────────────────────────────────────────────
export interface Gasto extends BaseDoc {
  descricao: string
  valor: number
  categoria: string
  data: string
  pessoa: string
  cartaoId?: string
}

export type GastoForm = Omit<Gasto, keyof BaseDoc>

// ─── Cartão de Crédito ────────────────────────────────────────────────────────
export interface Cartao extends BaseDoc {
  nome: string
  bandeira: string
  limite: number
  limiteUsado: number
  fechamento: number
  vencimento: number
  cor: string
}

export type CartaoForm = Omit<Cartao, keyof BaseDoc>

// ─── Parcelas ─────────────────────────────────────────────────────────────────
export interface Parcela extends BaseDoc {
  descricao: string
  valorTotal: number
  valorMensal: number
  parcelaAtual: number
  totalParcelas: number
  cartaoId?: string
  categoria: string
  dataInicio: string
  ativa: boolean
}

export type ParcelaForm = Omit<Parcela, keyof BaseDoc>

// ─── Dívidas ──────────────────────────────────────────────────────────────────
export type Prioridade = 'baixa' | 'media' | 'alta'

export interface Divida extends BaseDoc {
  descricao: string
  credor: string
  valor: number
  valorRestante: number
  juros: number
  dataVencimento: string
  prioridade: Prioridade
  pessoa: string
}

export type DividaForm = Omit<Divida, keyof BaseDoc>

// ─── Contas Fixas ─────────────────────────────────────────────────────────────
export interface ContaFixa extends BaseDoc {
  descricao: string
  valor: number
  diaVencimento: number
  categoria: string
  paga: boolean
  pessoa: string
}

export type ContaFixaForm = Omit<ContaFixa, keyof BaseDoc>

// ─── Contas Bancárias ─────────────────────────────────────────────────────────
export interface ContaBancaria extends BaseDoc {
  nome: string
  banco: string
  tipo: string
  saldo: number
  agencia?: string
  conta?: string
  pessoa?: string
  cor: string
}

export type ContaBancariaForm = Omit<ContaBancaria, keyof BaseDoc>

// ─── Metas ────────────────────────────────────────────────────────────────────
export interface Meta extends BaseDoc {
  nome: string
  descricao?: string
  valorAlvo: number
  valorAtual: number
  prazo: string
  categoria: string
  cor: string
}

export type MetaForm = Omit<Meta, keyof BaseDoc>

// ─── Finance Context ──────────────────────────────────────────────────────────
export interface FinanceContextType {
  // Dados
  entradas: Entrada[]
  gastos: Gasto[]
  cartoes: Cartao[]
  parcelas: Parcela[]
  dividas: Divida[]
  contasFixas: ContaFixa[]
  metas: Meta[]
  contas: ContaBancaria[]
  // Loading
  loading: boolean
  // Totais
  totalEntradas: number
  totalGastos: number
  totalParcelas: number
  totalDividas: number
  totalContasFixas: number
  saldoTotal: number
  // CRUD - Entradas
  addEntrada: (d: EntradaForm) => Promise<void>
  updateEntrada: (id: string, d: Partial<EntradaForm>) => Promise<void>
  removeEntrada: (id: string) => Promise<void>
  // CRUD - Gastos
  addGasto: (d: GastoForm) => Promise<void>
  updateGasto: (id: string, d: Partial<GastoForm>) => Promise<void>
  removeGasto: (id: string) => Promise<void>
  // CRUD - Cartões
  addCartao: (d: CartaoForm) => Promise<void>
  updateCartao: (id: string, d: Partial<CartaoForm>) => Promise<void>
  removeCartao: (id: string) => Promise<void>
  // CRUD - Parcelas
  addParcela: (d: ParcelaForm) => Promise<void>
  updateParcela: (id: string, d: Partial<ParcelaForm>) => Promise<void>
  removeParcela: (id: string) => Promise<void>
  // CRUD - Dívidas
  addDivida: (d: DividaForm) => Promise<void>
  updateDivida: (id: string, d: Partial<DividaForm>) => Promise<void>
  removeDivida: (id: string) => Promise<void>
  // CRUD - Contas Fixas
  addContaFixa: (d: ContaFixaForm) => Promise<void>
  updateContaFixa: (id: string, d: Partial<ContaFixaForm>) => Promise<void>
  removeContaFixa: (id: string) => Promise<void>
  // CRUD - Metas
  addMeta: (d: MetaForm) => Promise<void>
  updateMeta: (id: string, d: Partial<MetaForm>) => Promise<void>
  removeMeta: (id: string) => Promise<void>
  // CRUD - Contas bancárias
  addConta: (d: ContaBancariaForm) => Promise<void>
  updateConta: (id: string, d: Partial<ContaBancariaForm>) => Promise<void>
  removeConta: (id: string) => Promise<void>
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}
