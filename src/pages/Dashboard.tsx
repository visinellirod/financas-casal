import { useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import { StatCard } from '../components/ui'
import { fmt } from '../utils/format'
import { CHART_COLORS } from '../utils/constants'
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  Layers, CreditCard, Target, Building2, Calendar,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt.currency(p.value)}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const {
    entradas, gastos,
    totalEntradas, totalGastos, totalParcelas,
    totalDividas, totalContasFixas,
    metas, contas, parcelas, contasFixas,
  } = useFinance()

  const nome = user?.displayName || user?.email?.split('@')[0] || 'você'

  // Últimas 6 transações
  const recentes = useMemo(() => [
    ...entradas.map(e => ({ ...e, tipo: 'entrada' as const })),
    ...gastos.map(g => ({ ...g, tipo: 'gasto' as const })),
  ]
    .sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0))
    .slice(0, 6), [entradas, gastos])

  // Gastos por categoria para Pie
  const pieData = useMemo(() => {
    const map = gastos.reduce<Record<string, number>>((acc, g) => {
      const cat = g.categoria || 'Outros'
      acc[cat] = (acc[cat] || 0) + g.valor
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [gastos])

  // Saldo das contas bancárias
  const saldoContas = useMemo(() => contas.reduce((s, c) => s + (c.saldo || 0), 0), [contas])

  // Metas em andamento
  const metasAtivas = useMemo(() =>
    metas.filter(m => m.valorAtual < m.valorAlvo).slice(0, 3), [metas])

  // Próximas contas fixas a vencer (não pagas)
  const proximasContas = useMemo(() => {
    const hoje = new Date().getDate()
    return contasFixas
      .filter(c => !c.paga)
      .sort((a, b) => {
        const da = a.diaVencimento >= hoje ? a.diaVencimento - hoje : 31 - hoje + a.diaVencimento
        const db = b.diaVencimento >= hoje ? b.diaVencimento - hoje : 31 - hoje + b.diaVencimento
        return da - db
      })
      .slice(0, 4)
  }, [contasFixas])

  // Parcelas ativas
  const parcelasAtivas = useMemo(() => parcelas.filter(p => p.ativa).slice(0, 4), [parcelas])

  const saldo = totalEntradas - totalGastos

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Olá, {nome}! 👋
        </h1>
        <p className="text-slate-500 text-sm">Resumo financeiro do casal</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Entradas"   value={fmt.currency(totalEntradas)} icon={TrendingUp}    color="green"  />
        <StatCard label="Total Gastos"     value={fmt.currency(totalGastos)}   icon={TrendingDown}  color="red"    />
        <StatCard label="Saldo Atual"      value={fmt.currency(saldo)}         icon={Wallet}        color={saldo >= 0 ? 'green' : 'red'} />
        <StatCard label="Saldo em Contas"  value={fmt.currency(saldoContas)}   icon={Building2}     color="blue"   />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Parcelas/mês"     value={fmt.currency(totalParcelas)}    icon={Layers}        color="yellow"  />
        <StatCard label="Dívidas"          value={fmt.currency(totalDividas)}     icon={AlertTriangle} color="red"     />
        <StatCard label="Contas Fixas"     value={fmt.currency(totalContasFixas)} icon={Calendar}      color="purple"  />
        <StatCard label="Metas Ativas"     value={String(metasAtivas.length)}     icon={Target}        color="green"   />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Receitas vs Despesas */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Receitas vs Despesas
          </h2>
          {entradas.length === 0 && gastos.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
              Sem dados para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={[
                { name: 'Entradas', Entradas: totalEntradas, Gastos: 0 },
                { name: 'Gastos',   Entradas: 0, Gastos: totalGastos },
              ]}>
                <defs>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt.currency(v).replace('R$\u00a0', 'R$')} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gE)" strokeWidth={2} />
                <Area type="monotone" dataKey="Gastos"   stroke="#ef4444" fill="url(#gG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gastos por categoria */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-400" />
            Por Categoria
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
              Sem gastos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Últimas transações */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display font-semibold text-white mb-4">Últimas Transações</h2>
          {recentes.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">Sem transações recentes</p>
          ) : (
            <div className="space-y-2">
              {recentes.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-surface-700/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.tipo === 'entrada' ? 'bg-brand-500/10' : 'bg-red-500/10'
                    }`}>
                      {item.tipo === 'entrada'
                        ? <TrendingUp className="w-4 h-4 text-brand-400" />
                        : <TrendingDown className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{item.descricao}</p>
                      <p className="text-xs text-slate-500">{item.categoria} · {fmt.date(item.data)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${item.tipo === 'entrada' ? 'text-brand-400' : 'text-red-400'}`}>
                    {item.tipo === 'entrada' ? '+' : '-'}{fmt.currency(item.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Metas */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400" />
              Metas em Andamento
            </h2>
            {metasAtivas.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma meta ativa</p>
            ) : (
              <div className="space-y-3">
                {metasAtivas.map(m => {
                  const pct = m.valorAlvo > 0 ? (m.valorAtual / m.valorAlvo) * 100 : 0
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium truncate">{m.nome}</span>
                        <span className="text-slate-500 ml-2">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: m.cor || '#22c55e' }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{fmt.currency(m.valorAtual)} / {fmt.currency(m.valorAlvo)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Próximas contas */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              Próximas Contas Fixas
            </h2>
            {proximasContas.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhuma conta pendente</p>
            ) : (
              <div className="space-y-2">
                {proximasContas.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300 font-medium">{c.descricao}</p>
                      <p className="text-xs text-slate-500">Vence dia {c.diaVencimento}</p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-400">{fmt.currency(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parcelas ativas */}
          {parcelasAtivas.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Parcelas Ativas
              </h2>
              <div className="space-y-2">
                {parcelasAtivas.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300 font-medium truncate">{p.descricao}</p>
                      <p className="text-xs text-slate-500">{p.parcelaAtual}/{p.totalParcelas} parcelas</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">{fmt.currency(p.valorMensal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
