import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions, ProgressBar, Badge } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { PESSOAS } from '../utils/constants'
import { validateDivida } from '../utils/validators'
import { Plus, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import type { Divida, DividaForm, Prioridade } from '../types'

const EMPTY_FORM: DividaForm = {
  descricao: '', credor: '', valor: 0, valorRestante: 0,
  juros: 0, dataVencimento: todayISO(), prioridade: 'media', pessoa: 'Casal',
}

function DividaFormModal({
  initial = {},
  onSave,
  onClose,
}: {
  initial?: Partial<DividaForm>
  onSave: (d: DividaForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<DividaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof DividaForm>(k: K, v: DividaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  function handleValor(v: number) {
    set('valor', v)
    if (!initial.valorRestante) set('valorRestante', v)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateDivida(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        valor:         Number(form.valor),
        valorRestante: Number(form.valorRestante),
        juros:         Number(form.juros),
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Descrição">
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Empréstimo pessoal" required />
        </FormField>
        <FormField label="Credor">
          <input className="input" value={form.credor} onChange={e => set('credor', e.target.value)} placeholder="Ex: Banco, familiar..." />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Valor Total (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valor || ''} onChange={e => handleValor(Number(e.target.value))} placeholder="0,00" required />
        </FormField>
        <FormField label="Valor Restante (R$)">
          <input className="input" type="number" step="0.01" min="0" value={form.valorRestante || ''} onChange={e => set('valorRestante', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Juros (% a.m.)">
          <input className="input" type="number" step="0.01" min="0" value={form.juros || ''} onChange={e => set('juros', Number(e.target.value))} placeholder="0,00" />
        </FormField>
        <FormField label="Vencimento">
          <input className="input" type="date" value={form.dataVencimento} onChange={e => set('dataVencimento', e.target.value)} />
        </FormField>
        <FormField label="Prioridade">
          <Select value={form.prioridade} onChange={e => set('prioridade', e.target.value as Prioridade)}>
            <option value="baixa">🟢 Baixa</option>
            <option value="media">🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Responsável">
        <Select value={form.pessoa} onChange={e => set('pessoa', e.target.value)}>
          {PESSOAS.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </FormField>

      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

const PRIORIDADE_BADGE: Record<Prioridade, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  baixa: { label: '🟢 Baixa', variant: 'green' },
  media: { label: '🟡 Média', variant: 'yellow' },
  alta:  { label: '🔴 Alta',  variant: 'red' },
}

export default function Dividas() {
  const { dividas, addDivida, updateDivida, removeDivida } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Divida | null>(null)
  const [deleting,  setDeleting]  = useState<Divida | null>(null)

  const totalDivida   = useMemo(() => dividas.reduce((s, d) => s + (d.valor || 0), 0), [dividas])
  const totalRestante = useMemo(() => dividas.reduce((s, d) => s + (d.valorRestante || 0), 0), [dividas])
  const totalPago     = totalDivida - totalRestante

  const sorted = useMemo(() =>
    [...dividas].sort((a, b) => {
      const ord: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 }
      return (ord[a.prioridade] ?? 1) - (ord[b.prioridade] ?? 1)
    }), [dividas])

  async function handleSave(data: DividaForm) {
    try {
      if (editing) {
        await updateDivida(editing.id, data)
        success('Dívida atualizada!')
      } else {
        await addDivida(data)
        success('Dívida adicionada!')
      }
    } catch {
      error('Erro ao salvar dívida.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeDivida(deleting.id)
      success('Dívida removida.')
    } catch {
      error('Erro ao remover dívida.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Dívidas"
        desc="Controle de empréstimos e obrigações financeiras"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Dívida
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total de Dívidas"  value={fmt.currency(totalDivida)}   icon={AlertTriangle} color="red"    />
        <StatCard label="Valor Restante"    value={fmt.currency(totalRestante)}  icon={AlertTriangle} color="yellow" />
        <StatCard label="Total Pago"        value={fmt.currency(totalPago)}      icon={AlertTriangle} color="green"  />
      </div>

      {dividas.length === 0 ? (
        <div className="card">
          <Empty icon={AlertTriangle} title="Nenhuma dívida cadastrada" desc="Adicione suas dívidas para ter controle total" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(d => {
            const pago = d.valor > 0 ? ((d.valor - d.valorRestante) / d.valor) * 100 : 0
            const pb   = PRIORIDADE_BADGE[d.prioridade] ?? PRIORIDADE_BADGE.media
            return (
              <div key={d.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-white truncate">{d.descricao}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{d.credor || 'Sem credor'} · {d.pessoa}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => { setEditing(d); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(d)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Pago</span>
                    <span className="text-slate-400">{pago.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={pago} color="#22c55e" />
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <div>
                    <p className="text-slate-500 text-xs">Restante</p>
                    <p className="text-red-400 font-bold">{fmt.currency(d.valorRestante)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Total</p>
                    <p className="text-slate-300 font-semibold">{fmt.currency(d.valor)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={pb.variant}>{pb.label}</Badge>
                  {d.juros > 0 && <Badge variant="yellow">{d.juros}% a.m.</Badge>}
                  {d.dataVencimento && (
                    <span className="text-xs text-slate-500">Vence {fmt.date(d.dataVencimento)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Dívida' : 'Nova Dívida'}>
        <DividaFormModal initial={editing ?? {}} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover dívida?"
        desc={`"${deleting?.descricao}" será removida permanentemente.`}
      />
    </div>
  )
}
