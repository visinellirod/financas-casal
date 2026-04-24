import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { CATEGORIAS_ENTRADAS } from '../utils/constants'
import { validateEntrada } from '../utils/validators'
import { Plus, TrendingUp, Pencil, Trash2, RefreshCw } from 'lucide-react'
import type { Entrada, EntradaForm } from '../types'

const EMPTY_FORM: EntradaForm = {
  descricao: '', valor: 0, categoria: 'Salário',
  data: todayISO(), pessoa: '', recorrente: false,
}

interface FormProps {
  initial?: Partial<EntradaForm>
  onSave: (d: EntradaForm) => Promise<void>
  onClose: () => void
}

function EntradaFormModal({ initial = {}, onSave, onClose }: FormProps) {
  const [form, setForm] = useState<EntradaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof EntradaForm>(k: K, v: EntradaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateEntrada(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({ ...form, valor: Number(form.valor) })
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Descrição">
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Salário março" required />
        </FormField>
        <FormField label="Valor (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valor || ''} onChange={e => set('valor', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_ENTRADAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Data">
          <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
        </FormField>
      </div>
      <FormField label="Pessoa">
        <input className="input" value={form.pessoa} onChange={e => set('pessoa', e.target.value)} placeholder="Quem recebeu?" />
      </FormField>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={form.recorrente} onChange={e => set('recorrente', e.target.checked)} className="accent-brand-500 w-4 h-4" />
        <span className="text-sm text-slate-400">Receita recorrente (mensal)</span>
      </label>
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function Entradas() {
  const { entradas, addEntrada, updateEntrada, removeEntrada } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Entrada | null>(null)
  const [deleting,  setDeleting]  = useState<Entrada | null>(null)
  const [search,    setSearch]    = useState('')

  const filtered = useMemo(() =>
    entradas.filter(e =>
      e.descricao.toLowerCase().includes(search.toLowerCase()) ||
      e.categoria.toLowerCase().includes(search.toLowerCase()) ||
      e.pessoa?.toLowerCase().includes(search.toLowerCase()),
    ).sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0)),
    [entradas, search],
  )

  const total     = useMemo(() => entradas.reduce((s, e) => s + (e.valor || 0), 0), [entradas])
  const recorrentes = useMemo(() => entradas.filter(e => e.recorrente).reduce((s, e) => s + (e.valor || 0), 0), [entradas])

  async function handleSave(data: EntradaForm) {
    try {
      if (editing) {
        await updateEntrada(editing.id, data)
        success('Entrada atualizada com sucesso!')
      } else {
        await addEntrada(data)
        success('Entrada adicionada com sucesso!')
      }
    } catch {
      error('Erro ao salvar entrada.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeEntrada(deleting.id)
      success('Entrada removida.')
    } catch {
      error('Erro ao remover entrada.')
    }
  }

  function openEdit(e: Entrada) {
    setEditing(e)
    setModalOpen(true)
  }

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Entradas"
        desc="Receitas e ganhos do casal"
        action={
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Entrada
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total de Entradas" value={fmt.currency(total)}       icon={TrendingUp}  color="green"  />
        <StatCard label="Recorrentes/mês"   value={fmt.currency(recorrentes)} icon={RefreshCw}   color="blue"   />
        <StatCard label="Total de Registros" value={String(entradas.length)}  icon={TrendingUp}  color="purple" />
      </div>

      {/* Search */}
      <div>
        <input
          className="input max-w-xs"
          placeholder="Buscar entradas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <Empty icon={TrendingUp} title="Nenhuma entrada encontrada" desc="Adicione sua primeira receita clicando em 'Nova Entrada'" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/60">
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Descrição</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Categoria</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Pessoa</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Data</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Valor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-surface-700/30 last:border-0 table-row-hover">
                    <td className="px-5 py-3 text-slate-200 font-medium">
                      {e.descricao}
                      {e.recorrente && <span className="ml-2 text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">Recorrente</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{e.categoria}</td>
                    <td className="px-5 py-3 text-slate-400">{e.pessoa || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{fmt.date(e.data)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-400">{fmt.currency(e.valor)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(e)} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleting(e)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Entrada' : 'Nova Entrada'}>
        <EntradaFormModal
          initial={editing ?? {}}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* Confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover entrada?"
        desc={`"${deleting?.descricao}" será removida permanentemente.`}
      />
    </div>
  )
}
