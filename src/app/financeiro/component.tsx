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
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import useProjetoStore from '@/contextos/ProjetoStore'
import { format, subMonths } from 'date-fns'

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
      if (venc && venc > hoje) return acc
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
                  <div className="text-xs opacity-90">Available Balance</div>
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

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ translateY: -6 }} className="rounded-2xl p-6 shadow-md bg-green-500 text-white">
              <div className="text-xs opacity-90">Resumo Mensal</div>
              <div className="mt-3">
                <div className="text-lg font-semibold">Últimos {stacked.monthsArr.length} meses</div>
                <div className="text-sm opacity-80 mt-2">Visualize o fluxo por categorias no painel.</div>
              </div>
            </motion.div>
          </div>

          <div className="bg-dark-card p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-slate-300">Statistics</div>
                <div className="text-xs text-slate-400">Saldo Mensal (últimos meses)</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 items-center">
                  {stacked.categories.map(c => (
                    <div key={c} className="flex items-center gap-2 text-sm"><span style={{width:12,height:12,background:colorForCategory(c),display:'inline-block',borderRadius:3}}/> {c}</div>
                  ))}
                </div>
                <Button variante="secondary" onClick={() => exportCsv(items)}>Exportar CSV</Button>
              </div>
            </div>

            <div>
              <Chart options={balanceOptions} series={balanceSeries} type="area" height={300} />
            </div>
            <div className="mt-6">
              <Chart options={stackedOptions} series={stackedSeries} type="bar" height={240} />
            </div>
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
                  <motion.div key={i.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -4 }} className="group bg-slate-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{i.descricao || '—'}</div>
                          <div className="text-xs text-slate-400">{i.categoria} • {(i as any).projeto_id ? (projetos.find(p=>p.id===(i as any).projeto_id)?.nome || (i as any).projeto_id) : 'Sem projeto'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${i.tipo === 'a_receber' ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(Number(i.valor || 0))}</div>
                        <div className="text-xs text-slate-400">{(i as any).vencimento ? String((i as any).vencimento).split('T')[0] : (i.data ? String(i.data).split('T')[0] : '—')}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className={`text-xs ${i.pago ? 'text-emerald-300' : 'text-amber-300'}`}>{i.pago ? 'Pago' : 'Pendente'}</div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => abrirModal(i)} className="p-1 rounded hover:bg-slate-700"><Edit className="w-4 h-4 text-slate-200"/></button>
                        <button type="button" onClick={async () => { if (confirm('Remover lançamento?')) { await financeiroServico.excluir(i.id); await carregar() } }} className="p-1 rounded hover:bg-slate-700"><Trash2 className="w-4 h-4 text-slate-200"/></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>

          <Card className="p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Pendentes</div>
                <div className="text-xs text-gray-500">Lançamentos com vencimento futuro (não contabilizados no saldo até a data)</div>
              </div>
              <div className="text-sm text-gray-500">Total pendente: {formatCurrency(items.filter(i => (i as any).vencimento && new Date(String((i as any).vencimento)) > new Date()).reduce((s, it) => s + Number(it.valor||0) * (it.tipo==='a_receber'?1:-1), 0))}</div>
            </div>
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-light-muted border-b border-light-border dark:border-dark-border">
                    <th className="py-2 px-2">Descrição</th>
                    <th className="py-2 px-2">Categoria</th>
                    <th className="py-2 px-2">Vencimento</th>
                    <th className="py-2 px-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => (i as any).vencimento && new Date(String((i as any).vencimento)) > new Date()).map(i => (
                    <tr key={`${i.id}-pend`} className="border-b border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover">
                      <td className="py-2 px-2">{i.descricao || '—'}</td>
                      <td className="py-2 px-2">{i.categoria}</td>
                      <td className="py-2 px-2">{(i as any).vencimento ? String((i as any).vencimento).split('T')[0] : '—'}</td>
                      <td className="py-2 px-2">{formatCurrency(Number(i.valor||0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <Chart options={projectOptions} series={projectSeries} type="bar" height={240} />
            )}
          </Card>
        </div>

        <Modal isOpen={modalOpen} onClose={fecharModal} titulo={editing ? 'Editar Lançamento' : 'Novo Lançamento'} tamanho="full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Categoria" {...register('categoria' as any)} erro={errors.categoria?.message as any} />
              <select {...register('tipo' as any)} className="px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                <option value="a_pagar">A Pagar</option>
                <option value="a_receber">A Receber</option>
              </select>
              <ProjectSelector {...register('projeto_id' as any)} />
              <Controller control={control} name="valor" render={({ field }) => {
                const [display, setDisplay] = useState('')
                useEffect(() => setDisplay(field.value ? String(field.value).replace('.', ',') : ''), [field.value])
                const parseToNumber = (s: string) => { const n = parseFloat(s.replace(/\./g,'').replace(',','.')); return Number.isFinite(n) ? n : NaN }
                return <Input label="Valor" value={display} onChange={(e:any)=>{ setDisplay(e.target.value); const n = parseToNumber(e.target.value); field.onChange(Number.isFinite(n) ? String(n) : '') }} />
              }} />
              <Input label="Vencimento" type="date" {...register('vencimento' as any)} />
            </div>
            <div className="flex justify-end gap-3 pt-4"><Button type="button" variante="ghost" onClick={fecharModal}>Cancelar</Button><Button type="submit">{editing ? 'Salvar' : 'Adicionar'}</Button></div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
