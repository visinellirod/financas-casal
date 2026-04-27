import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions, ProgressBar, Badge } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { CATEGORIAS_GASTOS } from '../utils/constants'
import { validateParcela } from '../utils/validators'
import { Plus, Layers, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import type { Parcela, ParcelaForm } from '../types'

const EMPTY_FORM: ParcelaForm = {
  descricao: '', valorTotal: 0, valorMensal: 0,
  parcelaAtual: 1, totalParcelas: 12,
  cartaoId: '', categoria: 'Outros',
  dataInicio: todayISO(), ativa: true,
}

function ParcelaFormModal({
  initial = {},
  cartoes,
  onSave,
  onClose,
}: {
  initial?: Partial<ParcelaForm>
  cartoes: { id: string; nome: string }[]
  onSave: (d: ParcelaForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ParcelaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof ParcelaForm>(k: K, v: ParcelaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  // Auto-calculate valorMensal when valorTotal or totalParcelas changes
  function handleValorTotal(v: number) {
    set('valorTotal', v)
    if (form.totalParcelas > 0) set('valorMensal', parseFloat((v / form.totalParcelas).toFixed(2)))
  }
  function handleTotalParcelas(v: number) {
    set('totalParcelas', v)
    if (form.valorTotal > 0) set('valorMensal', parseFloat((form.valorTotal / v).toFixed(2)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateParcela(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        valorTotal:    Number(form.valorTotal),
        valorMensal:   Number(form.valorMensal),
        parcelaAtual:  Number(form.parcelaAtual),
        totalParcelas: Number(form.totalParcelas),
      })
      onClose()
    } catch {
      setError('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <FormField label="Descrição">
        <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: iPhone 15, Notebook..." required />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Valor Total (R$)">
          <input className="input" type="number" step="0.01" min="0" value={form.valorTotal || ''} onChange={e => handleValorTotal(Number(e.target.value))} placeholder="0,00" />
        </FormField>
        <FormField label="Valor Mensal (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valorMensal || ''} onChange={e => set('valorMensal', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Parcela Atual">
          <input className="input" type="number" min="1" value={form.parcelaAtual || ''} onChange={e => set('parcelaAtual', Number(e.target.value))} required />
        </FormField>
        <FormField label="Total de Parcelas">
          <input className="input" type="number" min="1" value={form.totalParcelas || ''} onChange={e => handleTotalParcelas(Number(e.target.value))} required />
        </FormField>
        <FormField label="Início">
          <input className="input" type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        {cartoes.length > 0 && (
          <FormField label="Cartão (opcional)">
            <Select value={form.cartaoId ?? ''} onChange={e => set('cartaoId', e.target.value)} placeholder="— Nenhum —">
              {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormField>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={form.ativa} onChange={e => set('ativa', e.target.checked)} className="accent-brand-500 w-4 h-4" />
        <span className="text-sm text-slate-400">Parcela ativa</span>
      </label>

      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function Parcelas() {
  const { parcelas, cartoes, addParcela, updateParcela, removeParcela } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Parcela | null>(null)
  const [deleting,  setDeleting]  = useState<Parcela | null>(null)

  const ativas    = useMemo(() => parcelas.filter(p => p.ativa), [parcelas])
  const inativas  = useMemo(() => parcelas.filter(p => !p.ativa), [parcelas])
  const totalMes  = useMemo(() => ativas.reduce((s, p) => s + (p.valorMensal || 0), 0), [ativas])
  const totalGeral = useMemo(() => ativas.reduce((s, p) => {
    const restantes = p.totalParcelas - p.parcelaAtual + 1
    return s + (p.valorMensal * restantes)
  }, 0), [ativas])

  const cartaoNome = (id?: string) => cartoes.find(c => c.id === id)?.nome ?? '—'

  async function handleSave(data: ParcelaForm) {
    try {
      if (editing) {
        await updateParcela(editing.id, data)
        success('Parcela atualizada!')
      } else {
        await addParcela(data)
        success('Parcela adicionada!')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      error('Erro ao salvar parcela: ' + msg)
      console.error('[Parcelas] handleSave error:', e)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeParcela(deleting.id)
      success('Parcela removida.')
    } catch {
      error('Erro ao remover parcela.')
    }
  }

  function ParcelaRow({ p }: { p: Parcela }) {
    const pct = p.totalParcelas > 0 ? (p.parcelaAtual / p.totalParcelas) * 100 : 0
    const restantes = p.totalParcelas - p.parcelaAtual
    return (
      <div className="card-hover p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-display font-semibold text-white">{p.descricao}</p>
            <p className="text-slate-500 text-xs mt-0.5">{p.categoria} · Cartão: {cartaoNome(p.cartaoId)}</p>
          </div>
          <div className="flex items-center gap-1">
            {!p.ativa && <Badge variant="gray">Encerrada</Badge>}
            <button onClick={() => { setEditing(p); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleting(p)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">Parcela {p.parcelaAtual} de {p.totalParcelas}</span>
            <span className="text-slate-400">{pct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={pct} color={p.ativa ? '#22c55e' : '#475569'} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-slate-500 text-xs">Mensal</p>
            <p className="text-brand-400 font-bold">{fmt.currency(p.valorMensal)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">{restantes} restantes</p>
            <p className="text-slate-300 font-semibold">{fmt.currency(p.valorMensal * restantes)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Parcelas"
        desc="Compras parceladas e financiamentos"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Parcela
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total/mês (ativas)" value={fmt.currency(totalMes)}    icon={Layers}        color="yellow"  />
        <StatCard label="Total restante"     value={fmt.currency(totalGeral)}   icon={Layers}        color="red"     />
        <StatCard label="Parcelas ativas"    value={String(ativas.length)}      icon={CheckCircle2}  color="green"   />
        <StatCard label="Encerradas"         value={String(inativas.length)}    icon={Layers}        color="purple"  />
      </div>

      {parcelas.length === 0 ? (
        <div className="card">
          <Empty icon={Layers} title="Nenhuma parcela cadastrada" desc="Adicione sua primeira compra parcelada" />
        </div>
      ) : (
        <>
          {ativas.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
                Parcelas Ativas ({ativas.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ativas.map(p => <ParcelaRow key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {inativas.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-slate-500 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Encerradas ({inativas.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {inativas.map(p => <ParcelaRow key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Parcela' : 'Nova Parcela'}>
        <ParcelaFormModal
          initial={editing ?? {}}
          cartoes={cartoes}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover parcela?"
        desc={`"${deleting?.descricao}" será removida permanentemente.`}
      />
    </div>
  )
}
