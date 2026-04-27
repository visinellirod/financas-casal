import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { CATEGORIAS_GASTOS, CHART_COLORS } from '../utils/constants'
import { validateGasto } from '../utils/validators'
import { Plus, TrendingDown, Pencil, Trash2, User } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Gasto, GastoForm } from '../types'

interface Props { pessoa: 'Vini' | 'Bell' }

function GastoFormModal({
  initial = {},
  pessoa,
  cartoes,
  onSave,
  onClose,
}: {
  initial?: Partial<GastoForm>
  pessoa: string
  cartoes: { id: string; nome: string }[]
  onSave: (d: GastoForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<GastoForm>({
    descricao: '', valor: 0, categoria: 'Alimentação',
    data: todayISO(), pessoa, cartaoId: '',
    ...initial,
  })
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
        <FormField label="Descrição">
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Almoço, Uber..." required />
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
      {cartoes.length > 0 && (
        <FormField label="Cartão (opcional)">
          <Select value={form.cartaoId ?? ''} onChange={e => set('cartaoId', e.target.value)} placeholder="— Nenhum —">
            {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </FormField>
      )}
      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

export default function GastosIndividuais({ pessoa }: Props) {
  const { gastos, cartoes, addGasto, updateGasto, removeGasto } = useFinance()
  const { success, error } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<Gasto | null>(null)
  const [deleting,  setDeleting]  = useState<Gasto | null>(null)
  const [search,    setSearch]    = useState('')

  // Filter by person
  const meus = useMemo(() =>
    gastos.filter(g => g.pessoa?.toLowerCase() === pessoa.toLowerCase()),
    [gastos, pessoa],
  )

  const filtered = useMemo(() =>
    meus
      .filter(g => g.descricao.toLowerCase().includes(search.toLowerCase()) || g.categoria.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0)),
    [meus, search],
  )

  const total = useMemo(() => meus.reduce((s, g) => s + g.valor, 0), [meus])

  const pieData = useMemo(() => {
    const map = meus.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.valor
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [meus])

  const emoji = pessoa === 'Vini' ? '👨' : '👩'
  const cor   = pessoa === 'Vini' ? 'text-blue-400' : 'text-pink-400'

  async function handleSave(data: GastoForm) {
    try {
      if (editing) {
        await updateGasto(editing.id, { ...data, pessoa })
        success('Gasto atualizado!')
      } else {
        await addGasto({ ...data, pessoa })
        success('Gasto adicionado!')
      }
    } catch (e) {
      error('Erro ao salvar gasto: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeGasto(deleting.id)
      success('Gasto removido.')
    } catch (e) {
      error('Erro ao remover gasto: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title={`Gastos de ${pessoa} ${emoji}`}
        desc={`Despesas individuais de ${pessoa}`}
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Novo Gasto
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={`Total de ${pessoa}`} value={fmt.currency(total)} icon={TrendingDown} color="red" />
        <StatCard label="Qtd. Gastos" value={String(meus.length)} icon={User} color="purple" />
        <StatCard label="Maior categoria" value={pieData.sort((a, b) => b.value - a.value)[0]?.name ?? '—'} icon={TrendingDown} color="yellow" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        {pieData.length > 0 && (
          <div className="card p-6">
            <h2 className={`font-display font-semibold mb-4 ${cor}`}>Por Categoria</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className={`${pieData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} card overflow-hidden`}>
          <div className="p-4 border-b border-surface-700/40">
            <input className="input max-w-xs" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <Empty icon={TrendingDown} title={`Nenhum gasto de ${pessoa}`} desc="Adicione o primeiro gasto individual" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700/60">
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Descrição</th>
                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Categoria</th>
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
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Editar Gasto de ${pessoa}` : `Novo Gasto de ${pessoa}`}>
        <GastoFormModal initial={editing ?? {}} pessoa={pessoa} cartoes={cartoes} onSave={handleSave} onClose={() => setModalOpen(false)} />
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
