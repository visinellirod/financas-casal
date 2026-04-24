import { useState, memo } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, TrendingUp, TrendingDown, CreditCard,
  Layers, AlertTriangle, FileText, Target, BarChart3,
  Building2, LogOut, Heart, Menu, X, ChevronRight,
  User, ChevronDown,
} from 'lucide-react'

interface SubItem { to: string; label: string }
interface NavItemDef {
  to?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  end?: boolean
  sub?: SubItem[]
}

const NAV: NavItemDef[] = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',         end: true },
  { to: '/entradas',     icon: TrendingUp,      label: 'Entradas' },
  {
    icon: TrendingDown, label: 'Gastos',
    sub: [
      { to: '/gastos',       label: '👫 Casal' },
      { to: '/gastos/vini',  label: '👨 Vini' },
      { to: '/gastos/bell',  label: '👩 Bell' },
    ],
  },
  { to: '/cartao',       icon: CreditCard,    label: 'Cartão de Crédito' },
  { to: '/parcelas',     icon: Layers,        label: 'Parcelas' },
  { to: '/dividas',      icon: AlertTriangle, label: 'Dívidas' },
  { to: '/contas-fixas', icon: FileText,      label: 'Contas Fixas' },
  { to: '/contas',       icon: Building2,     label: 'Contas Bancárias' },
  { to: '/metas',        icon: Target,        label: 'Metas' },
  { to: '/relatorios',   icon: BarChart3,     label: 'Relatórios' },
]

interface NavItemProps {
  item: NavItemDef
  onClose: () => void
}

const NavItem = memo(function NavItem({ item, onClose }: NavItemProps) {
  const [open, setOpen] = useState(false)

  if (item.sub) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-200 hover:bg-surface-800/60 transition-all duration-150 w-full"
        >
          <item.icon className="w-4 h-4 shrink-0 text-slate-600" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 pl-3 border-l border-surface-700/60">
            {item.sub.map(s => (
              <NavLink
                key={s.to}
                to={s.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                   ${isActive
                     ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                     : 'text-slate-500 hover:text-slate-200 hover:bg-surface-800/60'
                   }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to!}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
         ${isActive
           ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
           : 'text-slate-500 hover:text-slate-200 hover:bg-surface-800/60'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
          <span className="flex-1">{item.label}</span>
          {isActive && <ChevronRight className="w-3 h-3 text-brand-400" />}
        </>
      )}
    </NavLink>
  )
})

const SidebarContent = memo(function SidebarContent({
  user,
  onLogout,
  onClose,
}: {
  user: import('firebase/auth').User | null
  onLogout: () => void
  onClose: () => void
}) {
  return (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-surface-700/60">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-500/10 border border-brand-500/20">
          <Heart className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm leading-tight">Finanças do Casal</p>
          <p className="text-xs text-slate-500">Vini &amp; Bell 💚</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map((item, i) => (
          <NavItem key={i} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-surface-700/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 bg-surface-800/40">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-500/10">
            <User className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="text-xs text-slate-400 flex-1 truncate">{user?.email}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-400 rounded-xl hover:bg-red-500/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
})

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-surface-700/60 bg-surface-900/90">
        <SidebarContent user={user} onLogout={handleLogout} onClose={() => {}} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-surface-900 border-r border-surface-700/60 animate-slide-in">
            <div className="flex items-center justify-end p-4">
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent user={user} onLogout={handleLogout} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-700/60 bg-surface-900/80">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-brand-400" />
            <span className="font-display font-bold text-white text-sm">Finanças do Casal</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
