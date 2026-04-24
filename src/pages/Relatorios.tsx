import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useToast } from '../contexts/ToastContext'
import { StatCard, PageHeader } from '../components/ui'
import { fmt } from '../utils/format'
import { CHART_COLORS } from '../utils/constants'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import { BarChart3, Download, TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react'

// ── Lazy-import PDF/Excel so they don't block the page ───────────────────────
async function exportPDF(data: ReturnType<typeof buildReportData>) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Relatório Financeiro — Finanças do Casal', 14, 20)
  doc.setFontSize(11)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28)

  autoTable(doc, {
    startY: 35,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Entradas',   fmt.currency(data.totalEntradas)],
      ['Total de Gastos',     fmt.currency(data.totalGastos)],
      ['Saldo',               fmt.currency(data.saldo)],
      ['Total de Dívidas',    fmt.currency(data.totalDividas)],
      ['Parcelas/mês',        fmt.currency(data.totalParcelas)],
      ['Contas Fixas/mês',    fmt.currency(data.totalContasFixas)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  if (data.gastosPorCategoria.length > 0) {
    autoTable(doc, {
      startY: finalY,
      head: [['Categoria', 'Valor']],
      body: data.gastosPorCategoria.map(r => [r.name, fmt.currency(r.value)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] },
    })
  }

  doc.save('relatorio-financeiro.pdf')
}

async function exportExcel(data: ReturnType<typeof buildReportData>, raw: { entradas: unknown[]; gastos: unknown[] }) {
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summary = [
    ['Métrica', 'Valor'],
    ['Total de Entradas',   data.totalEntradas],
    ['Total de Gastos',     data.totalGastos],
    ['Saldo',               data.saldo],
    ['Total de Dívidas',    data.totalDividas],
    ['Parcelas/mês',        data.totalParcelas],
    ['Contas Fixas/mês',    data.totalContasFixas],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Resumo')

  // Entradas sheet
  if (raw.entradas.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw.entradas), 'Entradas')
  }

  // Gastos sheet
  if (raw.gastos.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw.gastos), 'Gastos')
  }

  // Categorias sheet
  if (data.gastosPorCategoria.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.gastosPorCategoria.map(r => ({ Categoria: r.name, Valor: r.value }))),
      'Por Categoria',
    )
  }

  XLSX.writeFile(wb, 'relatorio-financeiro.xlsx')
}

function buildReportData(finance: ReturnType<typeof useFinance>) {
  const { entradas, gastos, totalEntradas, totalGastos, totalParcelas, totalDividas, totalContasFixas } = finance

  const gastosPorCategoria = Object.entries(
    gastos.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.valor
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const gastosPorPessoa = Object.entries(
    gastos.reduce<Record<string, number>>((acc, g) => {
      const p = g.pessoa || 'Sem pessoa'
      acc[p] = (acc[p] || 0) + g.valor
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const entradasPorCategoria = Object.entries(
    entradas.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoria] = (acc[e.categoria] || 0) + e.valor
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const comparativo = [
    { name: 'Entradas',     valor: totalEntradas,    cor: '#22c55e' },
    { name: 'Gastos',       valor: totalGastos,      cor: '#ef4444' },
    { name: 'Parcelas/mês', valor: totalParcelas,    cor: '#f59e0b' },
    { name: 'Contas Fixas', valor: totalContasFixas, cor: '#3b82f6' },
    { name: 'Dívidas',      valor: totalDividas,     cor: '#a855f7' },
  ]

  return {
    totalEntradas, totalGastos, totalParcelas, totalDividas, totalContasFixas,
    saldo: totalEntradas - totalGastos,
    gastosPorCategoria,
    gastosPorPessoa,
    entradasPorCategoria,
    comparativo,
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs shadow-xl border-surface-700/60">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white">{fmt.currency(p.value)}</p>
      ))}
    </div>
  )
}

export default function Relatorios() {
  const finance = useFinance()
  const { success, error: showError } = useToast()
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  const report = useMemo(() => buildReportData(finance), [finance])

  const rawEntradas = useMemo(() => finance.entradas.map(e => ({
    Descrição: e.descricao, Valor: e.valor, Categoria: e.categoria,
    Data: e.data, Pessoa: e.pessoa,
  })), [finance.entradas])

  const rawGastos = useMemo(() => finance.gastos.map(g => ({
    Descrição: g.descricao, Valor: g.valor, Categoria: g.categoria,
    Data: g.data, Pessoa: g.pessoa,
  })), [finance.gastos])

  async function handleExportPDF() {
    setExporting('pdf')
    try {
      await exportPDF(report)
      success('PDF exportado com sucesso!')
    } catch {
      showError('Erro ao exportar PDF.')
    } finally {
      setExporting(null)
    }
  }

  async function handleExportExcel() {
    setExporting('excel')
    try {
      await exportExcel(report, { entradas: rawEntradas, gastos: rawGastos })
      success('Excel exportado com sucesso!')
    } catch {
      showError('Erro ao exportar Excel.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Relatórios"
        desc="Análise completa das finanças do casal"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={!!exporting}
              className="btn-secondary flex items-center gap-2"
            >
              {exporting === 'pdf'
                ? <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                : <Download className="w-4 h-4" />
              }
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!!exporting}
              className="btn-primary flex items-center gap-2"
            >
              {exporting === 'excel'
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Excel
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Entradas"       value={fmt.currency(report.totalEntradas)}    icon={TrendingUp}   color="green"  />
        <StatCard label="Gastos"         value={fmt.currency(report.totalGastos)}      icon={TrendingDown} color="red"    />
        <StatCard label="Saldo"          value={fmt.currency(report.saldo)}            icon={Wallet}       color={report.saldo >= 0 ? 'green' : 'red'} />
        <StatCard label="Dívidas Total"  value={fmt.currency(report.totalDividas)}     icon={FileText}     color="yellow" />
      </div>

      {/* Comparativo bar chart */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          Comparativo Geral
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={report.comparativo} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {report.comparativo.map((entry, i) => (
                <Cell key={i} fill={entry.cor} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gastos por categoria */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-4">Gastos por Categoria</h2>
          {report.gastosPorCategoria.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={report.gastosPorCategoria} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {report.gastosPorCategoria.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt.currency(v)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gastos por pessoa */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-4">Gastos por Pessoa</h2>
          {report.gastosPorPessoa.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={report.gastosPorPessoa} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {report.gastosPorPessoa.map((_, i) => (
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

      {/* Area chart — entradas vs gastos */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-white mb-4">Entradas vs Gastos</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={[
            { name: 'Total', Entradas: report.totalEntradas, Gastos: report.totalGastos },
          ]}>
            <defs>
              <linearGradient id="gE2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gG2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.5)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt.currency(v)} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gE2)" strokeWidth={2} />
            <Area type="monotone" dataKey="Gastos"   stroke="#ef4444" fill="url(#gG2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top gastos por categoria — table */}
      {report.gastosPorCategoria.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-700/40">
            <h2 className="font-display font-semibold text-white">Ranking por Categoria</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/60">
                  <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">#</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">Categoria</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-6 py-3">Valor</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-6 py-3">%</th>
                </tr>
              </thead>
              <tbody>
                {report.gastosPorCategoria.map((row, i) => (
                  <tr key={row.name} className="border-b border-surface-700/30 last:border-0 table-row-hover">
                    <td className="px-6 py-3 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-6 py-3 text-slate-200 font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {row.name}
                    </td>
                    <td className="px-6 py-3 text-right text-red-400 font-semibold">{fmt.currency(row.value)}</td>
                    <td className="px-6 py-3 text-right text-slate-400 text-xs">
                      {report.totalGastos > 0 ? ((row.value / report.totalGastos) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
