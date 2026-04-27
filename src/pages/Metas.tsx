import { useState, useMemo, type FormEvent } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { Modal, PageHeader, Empty, StatCard, FormField, Select, ConfirmDialog, FormActions, ProgressBar, Badge } from '../components/ui'
import { fmt, todayISO } from '../utils/format'
import { CATEGORIAS_METAS } from '../utils/constants'
import { validateMeta } from '../utils/validators'
import { Plus, Target, Pencil, Trash2, CheckCircle2, TrendingUp } from 'lucide-react'
import type { Meta, MetaForm } from '../types'

const CORES_PRESET = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316',
]

const EMPTY_FORM: MetaForm = {
  nome: '', descricao: '', valorAlvo: 0, valorAtual: 0,
  prazo: '', categoria: 'Poupança', cor: '#22c55e',
}

function MetaFormModal({
  initial = {},
  onSave,
  onClose,
}: {
  initial?: Partial<MetaForm>
  onSave: (d: MetaForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<MetaForm>({ ...EMPTY_FORM, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = <K extends keyof MetaForm>(k: K, v: MetaForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validateMeta(form as unknown as Record<string, unknown>)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        valorAlvo:  Number(form.valorAlvo),
        valorAtual: Number(form.valorAtual),
      })
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

      <FormField label="Nome da Meta">
        <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Viagem para Europa, Reserva de emergência..." required />
      </FormField>

      <FormField label="Descrição (opcional)">
        <input className="input" value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)} placeholder="Detalhes sobre a meta..." />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Valor Alvo (R$)">
          <input className="input" type="number" step="0.01" min="0.01" value={form.valorAlvo || ''} onChange={e => set('valorAlvo', Number(e.target.value))} placeholder="0,00" required />
        </FormField>
        <FormField label="Valor Atual (R$)">
          <input className="input" type="number" step="0.01" min="0" value={form.valorAtual || ''} onChange={e => set('valorAtual', Number(e.target.value))} placeholder="0,00" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            {CATEGORIAS_METAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Prazo (opcional)">
          <input className="input" type="date" value={form.prazo} onChange={e => set('prazo', e.target.value)} min={todayISO()} />
        </FormField>
      </div>

      <FormField label="Cor">
        <div className="flex items-center gap-2 flex-wrap">
          {CORES_PRESET.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set('cor', c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: form.cor === c ? 'white' : 'transparent',
                transform: form.cor === c ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
          <input type="color" value={form.cor} onChange={e => set('cor', e.target.value)} className="w-7 h-7 rounded-full border border-surface-700 bg-transparent cursor-pointer" title="Cor personalizada" />
        </div>
      </FormField>

      <FormActions onClose={onClose} loading={loading} />
    </form>
  )
}

// Quick deposit modal
function DepositModal({
  meta,
  onSave,
  onClose,
}: {
  meta: Meta
  onSave: (valorAtual: number) => Promise<void>
  onClose: () => void
}) {
  const [valor, setValor]     = useState(0)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valor || valor <= 0) return
    setLoading(true)
    try {
      await onSave(meta.valorAtual + valor)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-slate-400 text-sm">
        Saldo atual: <span className="text-brand-400 font-semibold">{fmt.currency(meta.valorAtual)}</span>
        {' '}/ Alvo: <span className="text-white font-semibold">{fmt.currency(meta.valorAlvo)}</span>
      </p>
      <FormField label="Valor do Aporte (R$)">
        <input className="input" type="number" step="0.01" min="0.01" value={valor || ''} onChange={e => setValor(Number(e.target.value))} placeholder="0,00" autoFocus required />
      </FormField>
      <FormActions onClose={onClose} loading={loading} submitLabel="Depositar" />
    </form>
  )
}

export default function Metas() {
  const { metas, addMeta, updateMeta, removeMeta } = useFinance()
  const { success, error } = useToast()

  const [modalOpen,    setModalOpen]    = useState(false)
  const [depositOpen,  setDepositOpen]  = useState(false)
  const [editing,      setEditing]      = useState<Meta | null>(null)
  const [deleting,     setDeleting]     = useState<Meta | null>(null)
  const [depositMeta,  setDepositMeta]  = useState<Meta | null>(null)

  const concluidas  = useMemo(() => metas.filter(m => m.valorAtual >= m.valorAlvo), [metas])
  const emAndamento = useMemo(() => metas.filter(m => m.valorAtual < m.valorAlvo), [metas])
  const totalAlvo   = useMemo(() => metas.reduce((s, m) => s + (m.valorAlvo || 0), 0), [metas])
  const totalAtual  = useMemo(() => metas.reduce((s, m) => s + (m.valorAtual || 0), 0), [metas])

  async function handleSave(data: MetaForm) {
    try {
      if (editing) {
        await updateMeta(editing.id, data)
        success('Meta atualizada!')
      } else {
        await addMeta(data)
        success('Meta adicionada!')
      }
    } catch (e) {
      error('Erro ao salvar meta: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await removeMeta(deleting.id)
      success('Meta removida.')
    } catch (e) {
      error('Erro ao remover meta: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleDeposit(novoValor: number) {
    if (!depositMeta) return
    try {
      await updateMeta(depositMeta.id, { valorAtual: novoValor })
      success('Aporte registrado!')
    } catch (e) {
      error('Erro ao registrar aporte.')
    }
  }

  function MetaCard({ m }: { m: Meta }) {
    const pct       = m.valorAlvo > 0 ? (m.valorAtual / m.valorAlvo) * 100 : 0
    const concluida = m.valorAtual >= m.valorAlvo
    const falta     = m.valorAlvo - m.valorAtual

    return (
      <div className="card-hover p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: `${m.cor}20`, borderColor: `${m.cor}30` }}
            >
              {concluida
                ? <CheckCircle2 className="w-5 h-5" style={{ color: m.cor }} />
                : <Target className="w-5 h-5" style={{ color: m.cor }} />
              }
            </div>
            <div>
              <p className="font-display font-semibold text-white">{m.nome}</p>
              <p className="text-slate-500 text-xs">{m.categoria}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setDepositMeta(m); setDepositOpen(true) }} className="btn-ghost p-1.5" title="Adicionar aporte">
              <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
            </button>
            <button onClick={() => { setEditing(m); setModalOpen(true) }} className="btn-ghost p-1.5"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleting(m)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {m.descricao && <p className="text-slate-500 text-xs mb-3">{m.descricao}</p>}

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">{fmt.currency(m.valorAtual)}</span>
            <span className="font-semibold" style={{ color: m.cor }}>{pct.toFixed(0)}%</span>
            <span className="text-slate-500">{fmt.currency(m.valorAlvo)}</span>
          </div>
          <ProgressBar value={pct} color={concluida ? '#22c55e' : m.cor} />
        </div>

        <div className="flex items-center justify-between">
          {concluida
            ? <Badge variant="green">✅ Meta Concluída!</Badge>
            : <span className="text-xs text-slate-500">Faltam {fmt.currency(falta)}</span>
          }
          {m.prazo && <span className="text-xs text-slate-600">Prazo: {fmt.date(m.prazo)}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Metas Financeiras"
        desc="Objetivos e sonhos do casal"
        action={
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Meta
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Alvo"      value={fmt.currency(totalAlvo)}        icon={Target}        color="blue"   />
        <StatCard label="Total Poupado"   value={fmt.currency(totalAtual)}       icon={TrendingUp}    color="green"  />
        <StatCard label="Em Andamento"    value={String(emAndamento.length)}     icon={Target}        color="yellow" />
        <StatCard label="Concluídas"      value={String(concluidas.length)}      icon={CheckCircle2}  color="green"  />
      </div>

      {metas.length === 0 ? (
        <div className="card">
          <Empty icon={Target} title="Nenhuma meta cadastrada" desc="Defina seus objetivos financeiros e acompanhe o progresso" />
        </div>
      ) : (
        <>
          {emAndamento.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                Em Andamento ({emAndamento.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emAndamento.map(m => <MetaCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {concluidas.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-brand-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Concluídas ({concluidas.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {concluidas.map(m => <MetaCard key={m.id} m={m} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Meta' : 'Nova Meta'}>
        <MetaFormModal initial={editing ?? {}} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>

      <Modal open={depositOpen} onClose={() => setDepositOpen(false)} title={`Aporte em "${depositMeta?.nome}"`} size="sm">
        {depositMeta && (
          <DepositModal meta={depositMeta} onSave={handleDeposit} onClose={() => setDepositOpen(false)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remover meta?"
        desc={`"${deleting?.nome}" será removida permanentemente.`}
      />
    </div>
  )
}
