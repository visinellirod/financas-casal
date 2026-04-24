import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions, ProgressBar } from '../components/ui'
import { fmt } from '../utils/format'
import { BANDEIRAS_CARTAO } from '../utils/constants'
import { validateCartao } from '../utils/validators'
import { Plus, CreditCard, Pencil, Trash2 } from 'lucide-react'
import type { Cartao, CartaoForm } from '../types'

const EMPTY_FORM: CartaoForm = {
  nome: '', bandeira: 'Visa', limite: 0, limiteUsado: 0,
  fechamento: 0, vencimento: 0, cor: '#22c55e',
}

function CartaoFormModal({
  initial = {},
  onSave,
  onClose,
}: {
  initial?: Partial<CartaoForm>
  onSave: (d: CartaoForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<CartaoForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof CartaoForm>(k: K, v: CartaoForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateCartao(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        limite:      Number(form.limite),
        limiteUsado: Number(form.limiteUsado),
        fechamento:  Number(form.fechamento),
        vencimento:  Number(form.vencimento),
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
        <FormField label="Nome do Cartão">
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Nubank, Inter..." required />
        </FormField>
        <FormField label="Bandeira">
          <Select value={form.bandeira} onChange={e => set('bandeira', e.target.value)}>
            {BANDEIRAS_CARTAO.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Limite Total (R$)">
          <input className="input" type="number" step="0.01" min="0" value={form.limite || ''} onChange={e => set('limite', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
        <FormField label="Limite Usado (R$)">
          <input className="input" type="number" step="0.01" min="0" value={form.limiteUsado || ''} onChange={e => set('limiteUsado', Number(e.target.value))} placeholder="0,00" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Dia de Fechamento">
          <input className="input" type="number" min="1" max="31" value={form.fechamento || ''} onChange={e => set('fechamento', Number(e.target.value))} placeholder="Ex: 10" />
        </FormField>
        <FormField label="Dia de Vencimento">
          <input className="input" type="number" min="1" max="31" value={form.vencimento || ''} onChange={e => set('vencimento', Number(e.target.value))} placeholder="Ex: 17" />
        </FormField>
      </div>
      <FormField label="Cor do Cartão">
        <div className="flex items-center gap-3">
          <input type="color" value={form.cor} onChange={e => set('cor', e.target.value)} className="w-10 h-10 rounded-lg border border-surface-700 bg-transparent cursor-pointer" />
          <span className="text-sm text-slate-400">{form.cor}</span>
        </div>
      </FormField>
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function CartaoCredito() {
  const { cartoes, addCartao, updateCartao, removeCartao } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Cartao | null>(null)
  const [deleting,  setDeleting]  = useState<Cartao | null>(null)

  const totalLimite = useMemo(() => cartoes.reduce((s, c) => s + c.limite, 0), [cartoes])
  const totalUsado  = useMemo(() => cartoes.reduce((s, c) => s + c.limiteUsado, 0), [cartoes])
  const disponivel  = totalLimite - totalUsado

  async function handleSave(data: CartaoForm) {
    try {
      if (editing) {
        await updateCartao(editing.id, data)
        success('Cartão atualizado!')
      } else {
        await addCartao(data)
        success('Cartão adicionado!')
      }
    } catch {
      error('Erro ao salvar cartão.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeCartao(deleting.id)
      success('Cartão removido.')
    } catch {
      error('Erro ao remover cartão.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Cartões de Crédito"
        desc="Gerencie seus cartões e limites"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Limite Total"    value={fmt.currency(totalLimite)} icon={CreditCard} color="blue"   />
        <StatCard label="Limite Usado"    value={fmt.currency(totalUsado)}  icon={CreditCard} color="red"    />
        <StatCard label="Limite Disponível" value={fmt.currency(disponivel)} icon={CreditCard} color="green" />
      </div>

      {cartoes.length === 0 ? (
        <div className="card">
          <Empty icon={CreditCard} title="Nenhum cartão cadastrado" desc="Adicione seu primeiro cartão de crédito" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cartoes.map(c => {
            const pct = c.limite > 0 ? (c.limiteUsado / c.limite) * 100 : 0
            const pctColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : c.cor
            return (
              <div key={c.id} className="card-hover p-5 relative overflow-hidden">
                {/* Color accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: c.cor }} />

                <div className="flex items-start justify-between mb-4 mt-1">
                  <div>
                    <p className="font-display font-bold text-white text-lg">{c.nome}</p>
                    <p className="text-slate-500 text-xs">{c.bandeira}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(c); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(c)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Usado</span>
                      <span style={{ color: pctColor }}>{pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={pct} color={pctColor} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Usado</p>
                      <p className="text-red-400 font-semibold">{fmt.currency(c.limiteUsado)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Disponível</p>
                      <p className="text-brand-400 font-semibold">{fmt.currency(c.limite - c.limiteUsado)}</p>
                    </div>
                  </div>
                  {(c.fechamento || c.vencimento) ? (
                    <div className="flex gap-4 text-xs text-slate-500 border-t border-surface-700/40 pt-3">
                      {c.fechamento ? <span>Fecha dia {c.fechamento}</span> : null}
                      {c.vencimento ? <span>Vence dia {c.vencimento}</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cartão' : 'Novo Cartão'}>
        <CartaoFormModal initial={editing ?? {}} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover cartão?"
        desc={`O cartão "${deleting?.nome}" será removido permanentemente.`}
      />
    </div>
  )
}
