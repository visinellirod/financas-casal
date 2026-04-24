import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import type { Toast, ToastType } from '../types'

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const success = useCallback((m: string) => toast(m, 'success'), [toast])
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast])
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast])

  const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id))

  const icons: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error:   XCircle,
    info:    Info,
  }

  const colors: Record<ToastType, string> = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error:   'border-red-500/30 bg-red-500/10 text-red-400',
    info:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
  }

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl animate-fade-up pointer-events-auto ${colors[t.type]}`}
              style={{ backgroundColor: 'rgba(8,15,30,0.95)' }}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1 text-sm text-slate-200">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
