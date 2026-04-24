import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} card p-6 animate-fade-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
type StatColor = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange'

interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color?: StatColor
  sub?: string
}

export function StatCard({ label, value, icon: Icon, color = 'green', sub }: StatCardProps) {
  const colors: Record<StatColor, string> = {
    green:  'bg-brand-500/10  text-brand-400  border-brand-500/20',
    red:    'bg-red-500/10    text-red-400    border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }
  return (
    <div className="card-hover p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs font-medium mb-0.5">{label}</p>
        <p className="font-display font-bold text-white text-xl truncate">{value}</p>
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}

export function Empty({ icon: Icon, title, desc }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-600" />
      </div>
      <p className="font-display font-semibold text-slate-400 mb-1">{title}</p>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  desc?: string
  action?: ReactNode
}

export function PageHeader({ title, desc, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">{title}</h1>
        {desc && <p className="text-slate-500 text-sm">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  desc: string
}

export function ConfirmDialog({ open, onClose, onConfirm, title, desc }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 max-w-sm w-full animate-fade-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-display font-semibold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6 pl-13">{desc}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => { onConfirm(); onClose() }} className="btn-danger">Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
}

export function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx('input', className)}
      {...props}
    />
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
  children: ReactNode
}

export function Select({ placeholder, children, className, ...props }: SelectProps) {
  return (
    <select className={clsx('input', className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'rounded-lg bg-gradient-to-r from-surface-800 via-surface-700 to-surface-800 bg-[length:200%_100%] animate-shimmer',
        className,
      )}
    />
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    green:  'bg-green-500/10  text-green-400  border-green-500/20',
    red:    'bg-red-500/10    text-red-400    border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gray:   'bg-slate-500/10  text-slate-400  border-slate-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number // 0-100
  color?: string
}

export function ProgressBar({ value, color = '#22c55e' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Form action buttons ──────────────────────────────────────────────────────
interface FormActionsProps {
  onClose: () => void
  loading?: boolean
  submitLabel?: string
}

export function FormActions({ onClose, loading, submitLabel = 'Salvar' }: FormActionsProps) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
        Cancelar
      </button>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Salvando...
          </span>
        ) : submitLabel}
      </button>
    </div>
  )
}
