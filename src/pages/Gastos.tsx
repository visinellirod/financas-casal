import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { CATEGORIAS_GASTOS } from '../utils/constants'
import { validateGasto } from '../utils/validators'
import { Plus, TrendingDown, Pencil, Trash2 } from 'lucide-react'
import type { Gasto, GastoForm } from '../types'

const EMPTY_FORM: GastoForm = {
  descricao: '', valor: 0, categoria: 'Alimentação',
  data: todayISO(), pessoa: 'Casal', cartaoId: '',
}

interface FormProps {
  initial?: Partial<GastoForm>
  cartoes: { id: string; nome: string }[]
  onSave: (d: GastoForm) => Promise<void>
  onClose: () => void
}

function GastoFormModal({ initial = {}, cartoes, onSave, onClose }: FormProps) {
  const [form, setForm] = useState<GastoForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof GastoForm>(k: K, v: GastoForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateGasto(form as unknown as Record<string, unknown>)
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
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Supermercado" required />
        </FormField>
        <FormField label="Valor (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valor || ''} onChange={e => set('valor', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Data">
          <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Pessoa">
          <input className="input" value={form.pessoa} onChange={e => set('pessoa', e.target.value)} placeholder="Quem gastou?" />
        </FormField>
        {cartoes.length > 0 && (
          <FormField label="Cartão (opcional)">
            <Select value={form.cartaoId ?? ''} onChange={e => set('cartaoId', e.target.value)} placeholder="— Nenhum —">
              {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormField>
        )}
      </div>
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function Gastos() {
  const { gastos, cartoes, addGasto, updateGasto, removeGasto } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Gasto | null>(null)
  const [deleting,  setDeleting]  = useState<Gasto | null>(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() =>
    gastos
      .filter(g =>
        (g.descricao.toLowerCase().includes(search.toLowerCase()) ||
         g.categoria.toLowerCase().includes(search.toLowerCase())) &&
        (catFilter ? g.categoria === catFilter : true),
      )
      .sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0)),
    [gastos, search, catFilter],
  )

  const total = useMemo(() => filtered.reduce((s, g) => s + (g.valor || 0), 0), [filtered])
  const porCategoria = useMemo(() => {
    const map = gastos.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.valor
      return acc
    }, {})
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [gastos])

  const cartaoNome = (id?: string) => cartoes.find(c => c.id === id)?.nome ?? ''

  async function handleSave(data: GastoForm) {
    try {
      if (editing) {
        await updateGasto(editing.id, data)
        success('Gasto atualizado!')
      } else {
        await addGasto(data)
        success('Gasto adicionado!')
      }
    } catch {
      error('Erro ao salvar gasto.')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeGasto(deleting.id)
      success('Gasto removido.')
    } catch {
      error('Erro ao remover gasto.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Gastos do Casal 👫"
        desc="Despesas compartilhadas entre Vini e Bell"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Novo Gasto
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Gastos"   value={fmt.currency(total)}         icon={TrendingDown} color="red"    />
        <StatCard label="Qtd. Registros"    value={String(gastos.length)}       icon={TrendingDown} color="purple" />
        {porCategoria.slice(0, 2).map(([cat, val]) => (
          <StatCard key={cat} label={cat} value={fmt.currency(val)} icon={TrendingDown} color="yellow" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Buscar gastos..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} placeholder="Todas as categorias" className="w-48">
          {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        {catFilter && <button onClick={() => setCatFilter('')} className="btn-ghost text-xs">Limpar filtro</button>}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <Empty icon={TrendingDown} title="Nenhum gasto encontrado" desc="Adicione o primeiro gasto do casal" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/60">
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Descrição</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Categoria</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Cartão</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Data</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Valor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id} className="border-b border-surface-700/30 last:border-0 table-row-hover">
                    <td className="px-5 py-3 text-slate-200 font-medium">{g.descricao}</td>
                    <td className="px-5 py-3 text-slate-400">{g.categoria}</td>
                    <td className="px-5 py-3 text-slate-400">{cartaoNome(g.cartaoId) || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{fmt.date(g.data)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-400">{fmt.currency(g.valor)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditing(g); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleting(g)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-surface-700/60">
                  <td colSpan={4} className="px-5 py-3 text-slate-400 text-xs">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-red-400">{fmt.currency(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Gasto' : 'Novo Gasto do Casal'}>
        <GastoFormModal
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
        title="Remover gasto?"
        desc={`"${deleting?.descricao}" será removido permanentemente.`}
      />
    </div>
  )
}
