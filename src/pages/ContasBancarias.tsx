import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions } from '../components/ui'
import { fmt } from '../utils/format'
import { TIPOS_CONTA, PESSOAS } from '../utils/constants'
import { validateContaBancaria } from '../utils/validators'
import { Plus, Building2, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import type { ContaBancaria, ContaBancariaForm } from '../types'

const EMPTY_FORM: ContaBancariaForm = {
  nome: '', banco: '', tipo: 'Corrente',
  saldo: 0, agencia: '', conta: '', pessoa: 'Casal', cor: '#22c55e',
}

function ContaFormModal({
  initial = {},
  onSave,
  onClose,
}: {
  initial?: Partial<ContaBancariaForm>
  onSave: (d: ContaBancariaForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ContaBancariaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof ContaBancariaForm>(k: K, v: ContaBancariaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateContaBancaria(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({ ...form, saldo: Number(form.saldo) })
      onClose()
    } catch (e) {
      setError('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nome da Conta">
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Conta Principal" required />
        </FormField>
        <FormField label="Banco / Instituição">
          <input className="input" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="Ex: Nubank, Itaú..." />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo de Conta">
          <Select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS_CONTA.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
        <FormField label="Saldo Atual (R$)">
          <input className="input" type="number" step="0.01" value={form.saldo ?? ''} onChange={e => set('saldo', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Agência (opcional)">
          <input className="input" value={form.agencia ?? ''} onChange={e => set('agencia', e.target.value)} placeholder="0000" />
        </FormField>
        <FormField label="Conta (opcional)">
          <input className="input" value={form.conta ?? ''} onChange={e => set('conta', e.target.value)} placeholder="000000-0" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Responsável">
          <Select value={form.pessoa ?? 'Casal'} onChange={e => set('pessoa', e.target.value)}>
            {PESSOAS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </FormField>
        <FormField label="Cor da Conta">
          <div className="flex items-center gap-3">
            <input type="color" value={form.cor} onChange={e => set('cor', e.target.value)} className="w-10 h-10 rounded-lg border border-surface-700 bg-transparent cursor-pointer" />
            <span className="text-sm text-slate-400">{form.cor}</span>
          </div>
        </FormField>
      </div>
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function ContasBancarias() {
  const { contas, addConta, updateConta, removeConta } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<ContaBancaria | null>(null)
  const [deleting,  setDeleting]  = useState<ContaBancaria | null>(null)

  const saldoTotal    = useMemo(() => contas.reduce((s, c) => s + (c.saldo || 0), 0), [contas])
  const saldoPositivo = useMemo(() => contas.filter(c => c.saldo >= 0).reduce((s, c) => s + c.saldo, 0), [contas])
  const saldoNegativo = useMemo(() => contas.filter(c => c.saldo < 0).reduce((s, c) => s + c.saldo, 0), [contas])

  async function handleSave(data: ContaBancariaForm) {
    try {
      if (editing) {
        await updateConta(editing.id, data)
        success('Conta atualizada!')
      } else {
        await addConta(data)
        success('Conta adicionada!')
      }
    } catch (e) {
      error('Erro ao salvar conta: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeConta(deleting.id)
      success('Conta removida.')
    } catch (e) {
      error('Erro ao remover conta: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Contas Bancárias"
        desc="Saldos e informações das suas contas"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Conta
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Saldo Total"     value={fmt.currency(saldoTotal)}    icon={Building2}    color={saldoTotal >= 0 ? 'green' : 'red'} />
        <StatCard label="Saldo Positivo"  value={fmt.currency(saldoPositivo)} icon={TrendingUp}   color="green"  />
        <StatCard label="Saldo Negativo"  value={fmt.currency(saldoNegativo)} icon={TrendingDown} color="red"    />
      </div>

      {contas.length === 0 ? (
        <div className="card">
          <Empty icon={Building2} title="Nenhuma conta cadastrada" desc="Adicione suas contas bancárias para controlar os saldos" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {contas.map(c => (
            <div key={c.id} className="card-hover p-5 relative overflow-hidden">
              {/* Color bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: c.cor }} />

              <div className="flex items-start justify-between mt-1 mb-4">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-white text-lg truncate">{c.nome}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{c.banco} · {c.tipo}</p>
                  {c.pessoa && <p className="text-slate-600 text-xs">{c.pessoa}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => { setEditing(c); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleting(c)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-700/40">
                <p className="text-slate-500 text-xs mb-1">Saldo atual</p>
                <p className={`font-display font-bold text-2xl ${c.saldo >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {fmt.currency(c.saldo)}
                </p>
              </div>

              {(c.agencia || c.conta) && (
                <div className="mt-3 flex gap-4 text-xs text-slate-600">
                  {c.agencia && <span>Ag: {c.agencia}</span>}
                  {c.conta   && <span>Cc: {c.conta}</span>}
                </div>
              )}
            </div>
          ))}

          {/* Total card */}
          <div className="card p-5 flex flex-col items-center justify-center text-center border-dashed border-surface-700/60">
            <p className="text-slate-500 text-sm mb-1">Patrimônio Total</p>
            <p className={`font-display font-bold text-3xl ${saldoTotal >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
              {fmt.currency(saldoTotal)}
            </p>
            <p className="text-slate-600 text-xs mt-1">{contas.length} conta{contas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Conta' : 'Nova Conta Bancária'}>
        <ContaFormModal initial={editing ?? {}} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover conta?"
        desc={`"${deleting?.nome}" será removida permanentemente.`}
      />
    </div>
  )
}
