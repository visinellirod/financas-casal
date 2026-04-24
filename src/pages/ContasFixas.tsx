import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions, Badge } from '../components/ui'
import { fmt } from '../utils/format'
import { CATEGORIAS_CONTAS_FIXAS, PESSOAS } from '../utils/constants'
import { validateContaFixa } from '../utils/validators'
import { Plus, FileText, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import type { ContaFixa, ContaFixaForm } from '../types'

const EMPTY_FORM: ContaFixaForm = {
  descricao: '', valor: 0, diaVencimento: 10,
  categoria: 'Casa', paga: false, pessoa: 'Casal',
}

function ContaFixaFormModal({
  initial = {},
  onSave,
  onClose,
}: {
  initial?: Partial<ContaFixaForm>
  onSave: (d: ContaFixaForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<ContaFixaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof ContaFixaForm>(k: K, v: ContaFixaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateContaFixa(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({ ...form, valor: Number(form.valor), diaVencimento: Number(form.diaVencimento) })
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
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel, Internet..." required />
        </FormField>
        <FormField label="Valor (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valor || ''} onChange={e => set('valor', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Dia de Vencimento">
          <input className="input" type="number" min="1" max="31" value={form.diaVencimento || ''} onChange={e => set('diaVencimento', Number(e.target.value))} required />
        </FormField>
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_CONTAS_FIXAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Responsável">
          <Select value={form.pessoa} onChange={e => set('pessoa', e.target.value)}>
            {PESSOAS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </FormField>
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={form.paga} onChange={e => set('paga', e.target.checked)} className="accent-brand-500 w-4 h-4" />
        <span className="text-sm text-slate-400">Já paga este mês</span>
      </label>
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function ContasFixas() {
  const { contasFixas, addContaFixa, updateContaFixa, removeContaFixa } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<ContaFixa | null>(null)
  const [deleting,  setDeleting]  = useState<ContaFixa | null>(null)

  const totalGeral  = useMemo(() => contasFixas.reduce((s, c) => s + (c.valor || 0), 0), [contasFixas])
  const totalPendente = useMemo(() => contasFixas.filter(c => !c.paga).reduce((s, c) => s + (c.valor || 0), 0), [contasFixas])
  const totalPagas  = totalGeral - totalPendente
  const pagas       = useMemo(() => contasFixas.filter(c => c.paga), [contasFixas])
  const pendentes   = useMemo(() => contasFixas.filter(c => !c.paga).sort((a, b) => a.diaVencimento - b.diaVencimento), [contasFixas])

  async function handleSave(data: ContaFixaForm) {
    try {
      if (editing) {
        await updateContaFixa(editing.id, data)
        success('Conta fixa atualizada!')
      } else {
        await addContaFixa(data)
        success('Conta fixa adicionada!')
      }
    } catch {
      error('Erro ao salvar conta fixa.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeContaFixa(deleting.id)
      success('Conta fixa removida.')
    } catch {
      error('Erro ao remover conta fixa.')
    }
  }

  async function togglePaga(c: ContaFixa) {
    try {
      await updateContaFixa(c.id, { paga: !c.paga })
      success(c.paga ? 'Marcada como pendente.' : 'Marcada como paga!')
    } catch {
      error('Erro ao atualizar.')
    }
  }

  function ContaRow({ c }: { c: ContaFixa }) {
    const hoje = new Date().getDate()
    const diasRestantes = c.diaVencimento >= hoje ? c.diaVencimento - hoje : 31 - hoje + c.diaVencimento
    const urgente = !c.paga && diasRestantes <= 3
    return (
      <tr className="border-b border-surface-700/30 last:border-0 table-row-hover">
        <td className="px-5 py-3">
          <button onClick={() => togglePaga(c)} className="transition-colors">
            {c.paga
              ? <CheckCircle2 className="w-5 h-5 text-brand-400" />
              : <Circle className="w-5 h-5 text-slate-600 hover:text-brand-400" />
            }
          </button>
        </td>
        <td className="px-5 py-3">
          <p className={`font-medium ${c.paga ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{c.descricao}</p>
          <p className="text-xs text-slate-500">{c.categoria} · {c.pessoa}</p>
        </td>
        <td className="px-5 py-3 text-slate-400">Dia {c.diaVencimento}</td>
        <td className="px-5 py-3">
          {c.paga
            ? <Badge variant="green">Paga</Badge>
            : urgente
              ? <Badge variant="red">Urgente</Badge>
              : <Badge variant="yellow">Pendente</Badge>
          }
        </td>
        <td className="px-5 py-3 text-right font-semibold text-slate-200">{fmt.currency(c.valor)}</td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => { setEditing(c); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleting(c)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Contas Fixas"
        desc="Contas mensais recorrentes do casal"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Conta Fixa
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Mensal"   value={fmt.currency(totalGeral)}    icon={FileText}    color="blue"   />
        <StatCard label="Pendentes"      value={fmt.currency(totalPendente)} icon={FileText}    color="yellow" />
        <StatCard label="Pagas"          value={fmt.currency(totalPagas)}    icon={CheckCircle2} color="green" />
        <StatCard label="Total Contas"   value={String(contasFixas.length)}  icon={FileText}    color="purple" />
      </div>

      {contasFixas.length === 0 ? (
        <div className="card">
          <Empty icon={FileText} title="Nenhuma conta fixa cadastrada" desc="Adicione suas contas mensais recorrentes" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/60">
                  <th className="px-5 py-3 w-10" />
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Descrição</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Vencimento</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Status</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Valor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pendentes.map(c => <ContaRow key={c.id} c={c} />)}
                {pagas.map(c => <ContaRow key={c.id} c={c} />)}
              </tbody>
              <tfoot>
                <tr className="border-t border-surface-700/60">
                  <td colSpan={4} className="px-5 py-3 text-slate-400 text-xs">Total mensal</td>
                  <td className="px-5 py-3 text-right font-bold text-white">{fmt.currency(totalGeral)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}>
        <ContaFixaFormModal initial={editing ?? {}} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover conta fixa?"
        desc={`"${deleting?.descricao}" será removida permanentemente.`}
      />
    </div>
  )
}
