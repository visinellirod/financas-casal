import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { FinanceProvider } from './contexts/FinanceContext'
import Layout from './components/layout/Layout'

// ─── Code-split pages ─────────────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/Login'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Entradas       = lazy(() => import('./pages/Entradas'))
const Gastos         = lazy(() => import('./pages/Gastos'))
const GastosVini     = lazy(() => import('./pages/GastosIndividuais'))
const CartaoCredito  = lazy(() => import('./pages/CartaoCredito'))
const Parcelas       = lazy(() => import('./pages/Parcelas'))
const Dividas        = lazy(() => import('./pages/Dividas'))
const ContasFixas    = lazy(() => import('./pages/ContasFixas'))
const ContasBancarias = lazy(() => import('./pages/ContasBancarias'))
const Metas          = lazy(() => import('./pages/Metas'))
const Relatorios     = lazy(() => import('./pages/Relatorios'))

// ─── Page skeleton loader ─────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-surface-800 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-surface-800 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-surface-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-24" />
        ))}
      </div>
      <div className="card p-6 h-64" />
    </div>
  )
}

// ─── Route guard ──────────────────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <FinanceProvider>
                <Layout />
              </FinanceProvider>
            </PrivateRoute>
          }
        >
          <Route index                  element={<Dashboard />} />
          <Route path="entradas"        element={<Entradas />} />
          <Route path="gastos"          element={<Gastos />} />
          <Route path="gastos/vini"     element={<GastosVini pessoa="Vini" />} />
          <Route path="gastos/bell"     element={<GastosVini pessoa="Bell" />} />
          <Route path="cartao"          element={<CartaoCredito />} />
          <Route path="parcelas"        element={<Parcelas />} />
          <Route path="dividas"         element={<Dividas />} />
          <Route path="contas-fixas"    element={<ContasFixas />} />
          <Route path="contas"          element={<ContasBancarias />} />
          <Route path="metas"           element={<Metas />} />
          <Route path="relatorios"      element={<Relatorios />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
