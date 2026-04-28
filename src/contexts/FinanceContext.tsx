import {
  createContext, useContext, useEffect, useState,
  useCallback, useMemo, type ReactNode,
} from 'react'
import {
  collection, onSnapshot, query, where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { fsAdd, fsUpdate, fsDelete, COLS } from '../firebase/firestore'
import { useAuth } from './AuthContext'
import type {
  FinanceContextType,
  Entrada, EntradaForm,
  Gasto, GastoForm,
  Cartao, CartaoForm,
  Parcela, ParcelaForm,
  Divida, DividaForm,
  ContaFixa, ContaFixaForm,
  Meta, MetaForm,
  ContaBancaria, ContaBancariaForm,
} from '../types'

const FinanceContext = createContext<FinanceContextType | null>(null)

function useCollection<T extends { id: string }>(
  col: string,
  userId: string | undefined,
): [T[], boolean] {
  const [data, setData]       = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }
    const q = query(collection(db, col), where('userId', '==', userId))
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as T)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [col, userId])

  return [data, loading]
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid

  const [entradas,    loadingEntradas]    = useCollection<Entrada>(COLS.entradas, uid)
  const [gastos,      loadingGastos]      = useCollection<Gasto>(COLS.gastos, uid)
  const [cartoes,     loadingCartoes]     = useCollection<Cartao>(COLS.cartoes, uid)
  const [parcelas,    loadingParcelas]    = useCollection<Parcela>(COLS.parcelas, uid)
  const [dividas,     loadingDividas]     = useCollection<Divida>(COLS.dividas, uid)
  const [contasFixas, loadingContasFixas] = useCollection<ContaFixa>(COLS.contasFixas, uid)
  const [metas,       loadingMetas]       = useCollection<Meta>(COLS.metas, uid)
  const [contas,      loadingContas]      = useCollection<ContaBancaria>(COLS.contas, uid)

  const loading = loadingEntradas || loadingGastos || loadingCartoes || loadingParcelas ||
                  loadingDividas || loadingContasFixas || loadingMetas || loadingContas

  // ── Totais ─────────────────────────────────────────────────────────────────
  const totalEntradas    = useMemo(() => entradas.reduce((s, e) => s + (e.valor || 0), 0), [entradas])
  const totalGastos      = useMemo(() => gastos.reduce((s, g) => s + (g.valor || 0), 0), [gastos])
  const totalParcelas    = useMemo(() => parcelas.filter(p => p.ativa).reduce((s, p) => s + (p.valorMensal || 0), 0), [parcelas])
  const totalDividas     = useMemo(() => dividas.reduce((s, d) => s + (d.valorRestante || d.valor || 0), 0), [dividas])
  const totalContasFixas = useMemo(() => contasFixas.filter(c => !c.paga).reduce((s, c) => s + (c.valor || 0), 0), [contasFixas])
  const saldoTotal       = useMemo(() => totalEntradas - totalGastos - totalParcelas, [totalEntradas, totalGastos, totalParcelas])

  // ── Reset automático mensal das contas fixas ───────────────────────────────
  useEffect(() => {
    if (!uid || contasFixas.length === 0 || loadingContasFixas) return

    const mesAtual = new Date().toISOString().slice(0, 7) // "YYYY-MM"

    const contasParaResetar = contasFixas.filter(
      c => c.paga && c.mesReferencia !== mesAtual
    )

    if (contasParaResetar.length === 0) return

    // Reseta todas as contas pagas que ainda não foram resetadas neste mês
    contasParaResetar.forEach(c => {
      fsUpdate(COLS.contasFixas, c.id, {
        paga: false,
        mesReferencia: mesAtual,
      })
    })
  }, [uid, contasFixas, loadingContasFixas])

  // ── Factory de CRUD ────────────────────────────────────────────────────────
  const add    = useCallback(<T extends Record<string, unknown>>(col: string, data: T) =>
    fsAdd(col, uid!, data as Record<string, unknown>), [uid])
  const update = useCallback(<T extends Record<string, unknown>>(col: string, id: string, data: T) =>
    fsUpdate(col, id, data as Record<string, unknown>), [])
  const remove = useCallback((col: string, id: string) =>
    fsDelete(col, id), [])

  // ── Entradas ────────────────────────────────────────────────────────────────
  const addEntrada    = useCallback((d: EntradaForm) => add(COLS.entradas, d), [add])
  const updateEntrada = useCallback((id: string, d: Partial<EntradaForm>) => update(COLS.entradas, id, d), [update])
  const removeEntrada = useCallback((id: string) => remove(COLS.entradas, id), [remove])

  // ── Gastos ─────────────────────────────────────────────────────────────────
  const addGasto    = useCallback((d: GastoForm) => add(COLS.gastos, d), [add])
  const updateGasto = useCallback((id: string, d: Partial<GastoForm>) => update(COLS.gastos, id, d), [update])
  const removeGasto = useCallback((id: string) => remove(COLS.gastos, id), [remove])

  // ── Cartões ────────────────────────────────────────────────────────────────
  const addCartao    = useCallback((d: CartaoForm) => add(COLS.cartoes, d), [add])
  const updateCartao = useCallback((id: string, d: Partial<CartaoForm>) => update(COLS.cartoes, id, d), [update])
  const removeCartao = useCallback((id: string) => remove(COLS.cartoes, id), [remove])

  // ── Parcelas ───────────────────────────────────────────────────────────────
  const addParcela    = useCallback((d: ParcelaForm) => add(COLS.parcelas, d), [add])
  const updateParcela = useCallback((id: string, d: Partial<ParcelaForm>) => update(COLS.parcelas, id, d), [update])
  const removeParcela = useCallback((id: string) => remove(COLS.parcelas, id), [remove])

  // ── Dívidas ────────────────────────────────────────────────────────────────
  const addDivida    = useCallback((d: DividaForm) => add(COLS.dividas, d), [add])
  const updateDivida = useCallback((id: string, d: Partial<DividaForm>) => update(COLS.dividas, id, d), [update])
  const removeDivida = useCallback((id: string) => remove(COLS.dividas, id), [remove])

  // ── Contas Fixas ───────────────────────────────────────────────────────────
  const addContaFixa    = useCallback((d: ContaFixaForm) => add(COLS.contasFixas, d), [add])
  const updateContaFixa = useCallback((id: string, d: Partial<ContaFixaForm>) => update(COLS.contasFixas, id, d), [update])
  const removeContaFixa = useCallback((id: string) => remove(COLS.contasFixas, id), [remove])

  // ── Metas ──────────────────────────────────────────────────────────────────
  const addMeta    = useCallback((d: MetaForm) => add(COLS.metas, d), [add])
  const updateMeta = useCallback((id: string, d: Partial<MetaForm>) => update(COLS.metas, id, d), [update])
  const removeMeta = useCallback((id: string) => remove(COLS.metas, id), [remove])

  // ── Contas Bancárias ───────────────────────────────────────────────────────
  const addConta    = useCallback((d: ContaBancariaForm) => add(COLS.contas, d), [add])
  const updateConta = useCallback((id: string, d: Partial<ContaBancariaForm>) => update(COLS.contas, id, d), [update])
  const removeConta = useCallback((id: string) => remove(COLS.contas, id), [remove])

  const value = useMemo<FinanceContextType>(() => ({
    entradas, gastos, cartoes, parcelas, dividas, contasFixas, metas, contas,
    loading,
    totalEntradas, totalGastos, totalParcelas, totalDividas, totalContasFixas, saldoTotal,
    addEntrada, updateEntrada, removeEntrada,
    addGasto, updateGasto, removeGasto,
    addCartao, updateCartao, removeCartao,
    addParcela, updateParcela, removeParcela,
    addDivida, updateDivida, removeDivida,
    addContaFixa, updateContaFixa, removeContaFixa,
    addMeta, updateMeta, removeMeta,
    addConta, updateConta, removeConta,
  }), [
    entradas, gastos, cartoes, parcelas, dividas, contasFixas, metas, contas,
    loading, totalEntradas, totalGastos, totalParcelas, totalDividas, totalContasFixas, saldoTotal,
    addEntrada, updateEntrada, removeEntrada,
    addGasto, updateGasto, removeGasto,
    addCartao, updateCartao, removeCartao,
    addParcela, updateParcela, removeParcela,
    addDivida, updateDivida, removeDivida,
    addContaFixa, updateContaFixa, removeContaFixa,
    addMeta, updateMeta, removeMeta,
    addConta, updateConta, removeConta,
  ])

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider')
  return ctx
}
