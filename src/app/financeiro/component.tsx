"use client"

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Form'
import financeiroServico from '@/servicos/financeiroServico'
import { Financeiro } from '@/tipos'
import { Plus, Edit, Trash2, DollarSign, Calendar, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import PremiumStatsCard from '@/components/financeiro/PremiumStatsCard'
import PremiumItemCard from '@/components/financeiro/PremiumItemCard'
import NovoLancamentoForm from '@/components/financeiro/NovoLancamentoForm'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import useProjetoStore from '@/contextos/ProjetoStore'
import { format, subMonths } from 'date-fns'
import PremiumProjectCostsChart from '@/components/financeiro/PremiumProjectCostsChart'

const financeiroSchema = z.object({
  categoria: z.string().min(1),
  tipo: z.enum(['a_pagar', 'a_receber']),
  projeto_id: z.string().optional(),
  descricao: z.string().optional(),
  valor: z.preprocess((v) => {
    if (typeof v === 'string') {
      let s = v.trim()
      if (s === '') return v
      if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
      else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.')
      const n = parseFloat(s)
      return Number.isFinite(n) ? n : v
    }
    return v
  }, z.number().min(0.01)),
  data: z.string().optional(),
  vencimento: z.string().optional(),
  pago: z.boolean().optional(),
})

type FinanceiroForm = z.infer<typeof financeiroSchema>

const ProjectSelector = React.forwardRef<HTMLSelectElement, any>(function ProjectSelector(props, ref) {
  const projetos = useProjetoStore(state => state.projetos)
  const carregarProjetos = useProjetoStore(state => state.carregarProjetos)
  useEffect(() => { if (!projetos || projetos.length === 0) carregarProjetos() }, [projetos, carregarProjetos])
  return (
    <select ref={ref} className="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" {...props}>
      <option value="">— Nenhum —</option>
      {projetos.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
    </select>
  )
})

function colorForCategory(cat: string) {
  const palette = ['#60a5fa','#34d399','#f59e0b','#fb7185','#a78bfa','#f97316','#ef4444','#06b6d4']
  let hash = 0
  for (let i = 0; i < cat.length; i++) hash = ((hash << 5) - hash) + cat.charCodeAt(i)
  return palette[Math.abs(hash) % palette.length]
}

export default function FinanceiroPage() {
  const [items, setItems] = useState<Financeiro[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Financeiro | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const statsRef = useRef<HTMLDivElement | null>(null)

  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const projetos = useProjetoStore(state => state.projetos)

  const { register, handleSubmit, reset, formState: { errors }, control, setValue } = useForm<FinanceiroForm>({ resolver: zodResolver(financeiroSchema), defaultValues: { tipo: 'a_pagar' } })

  useEffect(() => { carregar() }, [projetoAtual])

  async function carregar() {
    setLoading(true)
    try { const res = await financeiroServico.listar(projetoAtual ? projetoAtual.id : undefined); setItems(res || []) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function abrirModal(item?: Financeiro) {
    if (item) {
      setEditing(item)
      setValue('categoria', item.categoria)
      setValue('tipo', item.tipo)
      setValue('descricao', item.descricao || '')
      setValue('valor', item.valor as any)
      setValue('data', item.data ? String(item.data).split('T')[0] : '')
      setValue('vencimento', (item as any).vencimento ? String((item as any).vencimento).split('T')[0] : '')
      setValue('pago', !!item.pago)
    } else { setEditing(null); reset({}) }
    try { useProjetoStore.getState().carregarProjetos() } catch (e) {}
    setModalOpen(true)
  }

  function fecharModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data: FinanceiroForm) {
    try {
      const payload: any = { categoria: data.categoria, tipo: data.tipo, projeto_id: data.projeto_id || null, descricao: data.descricao || null, valor: Number(data.valor), data: data.data || null, vencimento: data.vencimento || null, pago: !!data.pago }
      if (editing) await financeiroServico.atualizar(editing.id, payload)
      else await financeiroServico.criar(payload)
      await carregar(); fecharModal()
    } catch (e) { console.error(e) }
  }

  function computeTotals(list: Financeiro[]) {
    const hoje = new Date()
    const totals = list.reduce((acc, i) => {
      // se tem vencimento no futuro, não conta ainda
        const venc = (i as any).vencimento ? new Date(String((i as any).vencimento)) : null
        // Exclude future-due items only for pagamentos; incluir receitas futuras em 'A Receber'
        if (venc && venc > hoje && i.tipo === 'a_pagar') return acc
        if (i.tipo === 'a_pagar') acc.aPagar += Number(i.valor || 0)
        else acc.aReceber += Number(i.valor || 0)
      return acc
    }, { aPagar: 0, aReceber: 0 })
    return { ...totals, saldo: totals.aReceber - totals.aPagar }
  }

  function stackedSeriesByMonth(list: Financeiro[], months = 6) {
    const now = new Date(); const monthsArr: any[] = []
    for (let i = months - 1; i >= 0; i--) { const d = subMonths(now, i); monthsArr.push({ label: format(d,'MM/yyyy'), byCategory: {}, total: 0 }) }
    let categories = Array.from(new Set(list.map(l => l.categoria || '').filter(Boolean)))
    if (categories.length === 0) categories = ['Receita', 'Despesa']
    // init buckets
    monthsArr.forEach(b => { categories.forEach(c => { b.byCategory[c] = 0 }); b.total = 0 })
    const hoje = new Date()
    list.forEach(it => {
      // ignore future-due itens when aggregating
      const venc = (it as any).vencimento ? new Date(String((it as any).vencimento)) : null
      if (venc && venc > hoje) return
      const d = it.data ? new Date(it.data) : new Date(it.criadoEm || it.atualizadoEm || Date.now())
      const label = format(d,'MM/yyyy')
      const bucket = monthsArr.find(b => b.label === label)
      if (bucket) {
        const cat = it.categoria && it.categoria !== '' ? it.categoria : (it.tipo === 'a_receber' ? 'Receita' : 'Despesa')
        const sign = it.tipo === 'a_receber' ? 1 : -1
        const v = Number(it.valor || 0) * sign
        bucket.byCategory[cat] = (bucket.byCategory[cat] || 0) + v
        bucket.total += v
        if (!categories.includes(cat)) categories.push(cat)
      }
    })
    // ensure each bucket has all categories (in case new categories appeared after reduction)
    monthsArr.forEach(b => { categories.forEach(c => { if (b.byCategory[c] === undefined) b.byCategory[c] = 0 }) })
    return { monthsArr, categories }
  }

  function totalsPerCategory(list: Financeiro[]) {
    const hoje = new Date()
    const map: Record<string, number> = {}
    list.forEach(i => {
      const venc = (i as any).vencimento ? new Date(String((i as any).vencimento)) : null
      if (venc && venc > hoje) return
      const cat = i.categoria || (i.tipo === 'a_receber' ? 'Receita' : 'Despesa')
      const sign = i.tipo === 'a_receber' ? 1 : -1
      map[cat] = (map[cat] || 0) + Number(i.valor || 0) * sign
    })
    return map
  }

  function showTooltip(e: React.MouseEvent, month: any, cat?: string) {
    const el = document.getElementById('financeiro-tooltip')
    if (!el) return
    el.style.left = (e.clientX + 10) + 'px'
    el.style.top = (e.clientY + 10) + 'px'
    el.style.display = 'block'
    const lines: string[] = [month.label]
    if (cat) lines.push(`${cat}: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(month.byCategory[cat]||0)}`)
    else { Object.entries(month.byCategory).forEach(([k,v]) => lines.push(`${k}: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)}`)); lines.push(`Total: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(month.total)}`) }
    el.innerHTML = lines.map(l => `<div>${l}</div>`).join('')
  }

  function hideTooltip(){ const el = document.getElementById('financeiro-tooltip'); if (el) el.style.display = 'none' }

  function exportCsv(items: Financeiro[]) {
    const { monthsArr, categories } = stackedSeriesByMonth(items, 12)
    const header = ['Mês', ...categories, 'Total']
    const rows = monthsArr.map(m => [m.label, ...categories.map(c => String(m.byCategory[c] ?? 0)), String(m.total)])
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `financeiro_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const totals = computeTotals(items)
  const stacked = stackedSeriesByMonth(items, 6)
  const perCategoryTotals = totalsPerCategory(items)
  function totalsPerProject(list: Financeiro[]) {
    const map: Record<string, number> = {}
    list.forEach(i => {
      const hoje = new Date()
      const venc = (i as any).vencimento ? new Date(String((i as any).vencimento)) : null
      if (venc && venc > hoje) return
      const pid = (i as any).projeto_id || ''
      const nome = pid ? (projetos?.find(p => p.id === pid)?.nome || String(pid)) : 'Sem projeto'
      // receitas (a_receber) são positivas, despesas (a_pagar) negativas
      const sign = i.tipo === 'a_receber' ? 1 : -1
      map[nome] = (map[nome] || 0) + Number(i.valor || 0) * sign
    })
    return map
  }

  const perProjectTotals = totalsPerProject(items)
  const projectLabels = Object.keys(perProjectTotals)
  // sort projects by absolute value desc for better visual
  projectLabels.sort((a,b) => Math.abs(perProjectTotals[b]||0) - Math.abs(perProjectTotals[a]||0))
  const projectSeries = [{ name: 'Valor líquido', data: projectLabels.map(l => Number((perProjectTotals[l] || 0).toFixed(2))) }]
  const projectOptions: any = {
    chart: { toolbar: { show: false }, foreColor: '#cbd5e1' },
    plotOptions: { bar: { horizontal: true, barHeight: '55%' } },
    xaxis: { labels: { formatter: (v: number) => formatCurrency(Number(v)) } },
    colors: projectLabels.map(l => (perProjectTotals[l] > 0 ? '#10b981' : '#ef4444')),
    tooltip: { theme: 'dark', y: { formatter: (v: number) => formatCurrency(Number(v)) } }
  }
  function monthlyBalance(list: Financeiro[], months = 6) {
    const { monthsArr } = stackedSeriesByMonth(list, months)
    const balances: number[] = []
    let cumulative = 0
    monthsArr.forEach(m => { cumulative += m.total; balances.push(cumulative) })
    return { monthsArr, balances }
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

  const monthsLabels = stacked.monthsArr.map(m => m.label.split('/')[0])
  const mb = monthlyBalance(items, stacked.monthsArr.length)
  const balanceSeries = [{ name: 'Saldo acumulado', data: mb.balances.map(b => Number(b.toFixed(2))) }]
  const balanceOptions: any = {
    chart: { toolbar: { show: false }, animations: { enabled: true }, foreColor: '#cbd5e1' },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 3 },
    fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', gradientToColors: ['#60a5fa'], opacityFrom: 0.7, opacityTo: 0.15 } },
    xaxis: { categories: monthsLabels },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => formatCurrency(v) } },
    colors: ['#60a5fa']
  }

  const stackedSeries = stacked.categories.map(c => ({ name: c, data: stacked.monthsArr.map(m => Number((m.byCategory[c] || 0).toFixed(2))) }))
  const stackedOptions: any = {
    chart: { stacked: true, toolbar: { show: false }, foreColor: '#cbd5e1' },
    plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
    xaxis: { categories: monthsLabels },
    colors: stacked.categories.map(c => colorForCategory(c)),
    tooltip: { theme: 'dark', y: { formatter: (v: number) => formatCurrency(v) } }
  }

  const donutSeries = stacked.categories.map(c => Math.abs(perCategoryTotals[c] || 0))
  const donutOptions: any = { labels: stacked.categories, colors: stacked.categories.map(c => colorForCategory(c)), legend: { position: 'bottom' }, tooltip: { theme: 'dark', y: { formatter: (v: number) => formatCurrency(v) } } }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-sm text-light-muted">Registre custos e receitas por projeto.</p>
          </div>
          <Button onClick={() => abrirModal()}><Plus className="w-4 h-4 mr-2"/> Novo Lançamento</Button>
        </div>

          <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ translateY: -6 }} className="rounded-2xl p-6 shadow-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-90">Saldo Disponível</div>
                  <div className="mt-2 text-2xl font-bold">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(totals.saldo)}</div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded ${totals.saldo < 0 ? 'bg-rose-600' : 'bg-emerald-600'} text-xs`}>{totals.saldo < 0 ? 'Negativo' : 'Positivo'}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
                <div className="flex-1">
                  <div className="text-xs">A Receber</div>
                  <div className="font-semibold">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(totals.aReceber)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs">A Pagar</div>
                  <div className="font-semibold">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(totals.aPagar)}</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ translateY: -6 }} className="rounded-2xl p-6 shadow-md bg-slate-800 text-white">
              <div className="text-xs opacity-80">Categorias</div>
              <div className="mt-3 space-y-2">
                {Object.keys(perCategoryTotals).length === 0 ? <div className="text-sm text-slate-400">Sem categorias</div> : Object.entries(perCategoryTotals).map(([c, v]) => (
                  <div key={c} className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><span style={{width:12,height:12,background:colorForCategory(c),display:'inline-block',borderRadius:4}} /> <div className="text-sm">{c}</div></div>
                    <div className={`${v < 0 ? 'text-rose-400' : 'text-emerald-400'} font-medium`}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div role="button" tabIndex={0} onClick={() => statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ translateY: -6 }} className="cursor-pointer rounded-2xl p-6 shadow-md bg-green-500 text-white hover:shadow-lg focus:ring-2 focus:ring-green-400">
              <div className="text-xs opacity-90">Resumo Mensal</div>
              <div className="mt-3">
                <div className="text-lg font-semibold">Últimos {stacked.monthsArr.length} meses</div>
                <div className="text-sm opacity-80 mt-2">Clique para ver detalhes e exportar.</div>
              </div>
            </motion.div>
          </div>

          <div ref={statsRef as any}>
            <PremiumStatsCard balanceOptions={balanceOptions} balanceSeries={balanceSeries} stackedOptions={stackedOptions} stackedSeries={stackedSeries} categories={stacked.categories} exportCsv={exportCsv} items={items} />
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Lançamentos</div>
              <div className="text-xs text-gray-500">Últimos lançamentos financeiros</div>
            </div>
            <div className="text-sm text-gray-500">Total: {formatCurrency(totals.saldo)}</div>
          </div>

          <div className="overflow-auto">
            {loading ? <div className="py-6 text-center">Loading...</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(i => (
                  <PremiumItemCard key={i.id} item={i} onEdit={(it:any)=>abrirModal(it)} onDelete={async (it:any) => { if (confirm('Remover lançamento?')) { await financeiroServico.excluir(it.id); await carregar() } }} projetos={projetos} formatCurrency={formatCurrency} />
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-light-muted">Custos por Projeto</div>
                <div className="text-xs text-gray-500">Visão dos custos (positivo = custo líquido)</div>
              </div>
            </div>
            {projectLabels.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum dado por projeto</div>
            ) : (
              <PremiumProjectCostsChart data={projectLabels.map(l => {
                const proj = projetos?.find((p:any) => p.id === l)
                const displayName = proj ? proj.nome : l
                return { name: displayName, value: Number((perProjectTotals[l] || 0).toFixed(2)) }
              })} formatCurrency={formatCurrency} />
            )}
          </Card>
        </div>

        <Modal isOpen={modalOpen} onClose={fecharModal} titulo={editing ? 'Editar Lançamento' : 'Novo Lançamento'} tamanho="full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <NovoLancamentoForm register={register} control={control} errors={errors} setValue={setValue} projetos={projetos} onCancel={fecharModal} onSubmit={onSubmit} editing={editing} />
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
