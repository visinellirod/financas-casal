import type { Timestamp } from 'firebase/firestore'

type FirestoreTimestamp = Timestamp | { toDate: () => Date }

export const fmt = {
  currency: (v: number = 0): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),

  date: (v: string | FirestoreTimestamp | undefined | null): string => {
    if (!v) return '—'
    const d = typeof v === 'object' && 'toDate' in v ? v.toDate() : new Date(v as string)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR').format(d)
  },

  month: (v: string | FirestoreTimestamp | undefined | null): string => {
    if (!v) return '—'
    const d = typeof v === 'object' && 'toDate' in v ? v.toDate() : new Date(v as string)
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
  },

  percent: (v: number = 0): string => `${(v * 100).toFixed(1)}%`,

  number: (v: number = 0): string =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v),
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(y, m - 1, 1))
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
