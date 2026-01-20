"use client"

import React, { useEffect, useState } from 'react'
// replace apexcharts with recharts for a nicer client-side chart
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import dynamic from 'next/dynamic'
import MainLayout from '@/layouts/MainLayout'
import { Card, ProgressBar, Avatar, Badge } from '@/components/ui/Elements'
import StatsCard from '@/components/dashboard/StatsCard'
import UserCard from '@/components/dashboard/UserCard'
import PerformanceCard from '@/components/dashboard/PerformanceCard'
// Replaced `liquid-glass-react` with CSS-based `liquid-card` to avoid positioning transforms
import { Button } from '@/components/ui'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Users,
  FolderKanban,
  Activity,
  FileText,
  Link as LinkIcon,
  CalendarDays,
  BarChart3,
  PieChart,
  Zap
} from 'lucide-react'
import useProjetoStore from '@/contextos/ProjetoStore'
import { projetoServico } from '@/servicos/projetoServico'
import { historicoServico } from '@/servicos/historicoServico'
import { tarefaServico } from '@/servicos/tarefaServico'
import { workspaceServico } from '@/servicos/workspaceServico'
import { usuarioServico } from '@/servicos'

export default function DashboardPage() {
  // Using Recharts (client component) instead of apexcharts for richer visuals
  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  // Read workspaceId on client after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const id = localStorage.getItem('workspaceId')
      setWorkspaceId(id)
    } catch (e) {
      setWorkspaceId(null)
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any | null>(null)
  const [workspace, setWorkspace] = useState<any | null>(null)
  const [projetos, setProjetos] = useState<any[]>([])
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([])
  const [userSummaries, setUserSummaries] = useState<any[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, number>>({})
  const [tasksByPriority, setTasksByPriority] = useState<Record<string, number>>({})
  const [chartSeries, setChartSeries] = useState<any[]>([])
  const [chartOptions, setChartOptions] = useState<any>({})

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        // If a project is selected, load project-scoped dashboard
        if (projetoAtual && projetoAtual.id) {
          const s = await projetoServico.estatisticas(projetoAtual.id)
          setStats(s)

          const tarefasRes = await tarefaServico.listarPorProjeto(projetoAtual.id, 1, 100, true)
          const todasTarefas = tarefasRes.dados || []

          // Build chart series from project tasks (created vs completed per month)
          try {
            const byMonth: Record<string, { created: number; completed: number }> = {}
            todasTarefas.forEach((t: any) => {
              const dt = new Date(t.criadoEm || t.createdAt || t.created_at || t.dataCriacao || t.criado_em || t.dataCriacao)
              if (isNaN(dt.getTime())) return
              const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
              byMonth[key] = byMonth[key] || { created: 0, completed: 0 }
              byMonth[key].created += 1
              if ((t.status && String(t.status) === 'concluida') || (t.concluida === true)) {
                byMonth[key].completed += 1
              }
            })

            // Build last 6 months labels (ensures chart always shows a range)
            const months = (() => {
              const out: { key: string; label: string }[] = []
              const now = new Date()
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                out.push({ key, label: d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }) })
              }
              return out
            })()

            const labels = months.map(m => m.label)
            const created = months.map(m => (byMonth[m.key]?.created) || 0)
            const completed = months.map(m => (byMonth[m.key]?.completed) || 0)
            setChartSeries([{ name: 'created', data: created }, { name: 'completed', data: completed }])
            setChartOptions({ xaxis: { categories: labels } })
          } catch (e) {
            // ignore chart build errors
          }
          setRecentTasks(todasTarefas.slice(0, 5))

          // Calculate task distributions
          const byStatus = todasTarefas.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1
            return acc
          }, {})
          setTasksByStatus(byStatus)

          const byPriority = todasTarefas.reduce((acc, t) => {
            acc[t.prioridade] = (acc[t.prioridade] || 0) + 1
            return acc
          }, {})
          setTasksByPriority(byPriority)

          const hist = await historicoServico.porProjeto(projetoAtual.id, 1, 10)
          setRecentActivities(hist.dados || [])
          return
        }

        // Otherwise, if a workspace is selected, load workspace-scoped aggregates
        if (workspaceId) {
          // Load workspace info
          const ws = await workspaceServico.buscarPorId(workspaceId)
          setWorkspace(ws)

          // Load projects
          const projsRes = await projetoServico.listarPorWorkspace(workspaceId)
          const allProjetos = projsRes.dados || projsRes || []
          setProjetos(allProjetos)

          // Fetch all tasks to compute stats (including archived for accurate statistics)
          const tarefasPage = await tarefaServico.listarPorWorkspace(workspaceId, 1, 1000, true)
          const todas = tarefasPage.dados || []

          // Build chart series from workspace tasks (created vs completed per month)
          try {
            const byMonth: Record<string, { created: number; completed: number }> = {}
            todas.forEach((t: any) => {
              const dt = new Date(t.criadoEm || t.createdAt || t.created_at || t.dataCriacao || t.criado_em || t.dataCriacao)
              if (isNaN(dt.getTime())) return
              const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
              byMonth[key] = byMonth[key] || { created: 0, completed: 0 }
              byMonth[key].created += 1
              if ((t.status && String(t.status) === 'concluida') || (t.concluida === true)) {
                byMonth[key].completed += 1
              }
            })

            // Build last 6 months labels (ensures chart always shows a range)
            const months = (() => {
              const out: { key: string; label: string }[] = []
              const now = new Date()
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                out.push({ key, label: d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }) })
              }
              return out
            })()

            const labels = months.map(m => m.label)
            const created = months.map(m => (byMonth[m.key]?.created) || 0)
            const completed = months.map(m => (byMonth[m.key]?.completed) || 0)
            setChartSeries([{ name: 'created', data: created }, { name: 'completed', data: completed }])
            setChartOptions({ xaxis: { categories: labels } })
          } catch (e) {
            // ignore chart build errors
          }

          // Helpers to extract user id from possible task shapes
          const getResponsavelId = (t: any) => t?.responsavel?.id || t?.responsavelId || t?.responsavel_id || null
          const getCriadorId = (t: any) => t?.criador?.id || t?.criadorId || t?.criador_id || null

          // Helpers to normalize status/priority and compute derived stats
          const getStatus = (t: any) => {
            if (!t) return 'pendente'
            if (typeof t.status === 'string') return t.status
            if (t.status && typeof t.status === 'object') return t.status.slug || t.status.nome || String(t.status)
            return t.status || 'pendente'
          }

          const getPriority = (t: any) => {
            if (!t) return 'media'
            if (typeof t.prioridade === 'string') return t.prioridade
            if (t.prioridade && typeof t.prioridade === 'object') return t.prioridade.slug || t.prioridade.nome || 'media'
            return t.prioridade || 'media'
          }

          // Estimate members active by unique responsavel/creator ids in tasks
          const membroIds = new Set<string>()
          todas.forEach(t => {
            const r = getResponsavelId(t)
            const c = getCriadorId(t)
            if (r) membroIds.add(r)
            if (c) membroIds.add(c)
          })

          const tarefasTotal = todas.length
          const tarefasConcluidas = todas.filter((t: any) => getStatus(t) === 'concluida').length
          const tarefasEmProgresso = todas.filter((t: any) => getStatus(t) === 'em_progresso').length
          const tarefasPendentes = todas.filter((t: any) => getStatus(t) === 'pendente').length
          const tarefasAtrasadas = todas.filter((t: any) => {
            if ((t as any)?.dataVencimento && getStatus(t) !== 'concluida') {
              const vencimento = new Date((t as any).dataVencimento)
              return vencimento < new Date()
            }
            return false
          }).length

          // Calculate task distributions
          const byStatus = todas.reduce((acc: any, t: any) => {
            const key = String(getStatus(t) || 'unknown')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByStatus(byStatus)

          const byPriority = todas.reduce((acc: any, t: any) => {
            const key = String(getPriority(t) || 'media')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByPriority(byPriority)

          setStats({
            tarefasTotal,
            tarefasConcluidas,
            tarefasEmProgresso,
            tarefasPendentes,
            tarefasAtrasadas,
            membrosAtivos: membroIds.size,
            projetosTotal: allProjetos.length,
            taxaConclusao: tarefasTotal > 0 ? Math.round((tarefasConcluidas / tarefasTotal) * 100) : 0
          })

          const recent = await tarefaServico.listarPorWorkspace(workspaceId, 1, 8)
          setRecentTasks(recent.dados || [])

          // Load workspace users (top contributors) and compute per-user task progress
          try {
            const usersRes = await usuarioServico.listarPorWorkspace(workspaceId, 1, 8)
            const users = usersRes.dados || usersRes || []
            setWorkspaceUsers(users)
            const summaries = users.map((u: any) => {
              const userTasks = todas.filter((t: any) => {
                const r = getResponsavelId(t)
                const c = getCriadorId(t)
                return r === u.id || c === u.id
              })
              const total = userTasks.length
              const done = userTasks.filter((t: any) => getStatus(t) === 'concluida').length
              const open = total - done
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return { usuario: u, total, done, open, pct }
            })
            setUserSummaries(summaries)
          } catch (e) {
            console.warn('Erro carregando usuários do workspace', e)
          }

          const hist = await historicoServico.porWorkspace(workspaceId, 1, 15)
          setRecentActivities(hist.dados || [])
          return
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [projetoAtual, workspaceId])

  if (!projetoAtual && !workspaceId) {
    return (
      <MainLayout>
        <Card className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Bem-vindo ao Align CRM</h3>
          <p className="text-gray-500">Selecione um workspace para começar</p>
        </Card>
      </MainLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'text-green-600 bg-green-100'
      case 'em_progresso': return 'text-blue-600 bg-blue-100'
      case 'pendente': return 'text-yellow-600 bg-yellow-100'
      case 'cancelada': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'text-red-600 bg-red-100'
      case 'media': return 'text-yellow-600 bg-yellow-100'
      case 'baixa': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 60) return `${minutes}min atrás`
      if (hours < 24) return `${hours}h atrás`
      if (days < 7) return `${days}d atrás`
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  return (
    <MainLayout showDashboardLogo>
      <div className="space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {projetoAtual ? `Projeto: ${projetoAtual.nome}` : workspace ? `Workspace: ${workspace.nome}` : 'Visão Geral'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-align-500" />
              <span>Carregando...</span>
            </div>
          )}
        </div>

        {/* Storage Indicator removed from dashboard view */}

        {/* Top profile / mini-cards like the design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <style jsx global>{`
            /* Enhanced CSS liquid-glass effect (no external lib) */
            .liquid-card { display: block; }
            .liquid-card > .rounded-2xl { position: relative; overflow: hidden; border-radius: 16px; }

            /* soft layered backdrop + subtle border gradient */
            .liquid-card > .rounded-2xl::before {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
              pointer-events: none;
              mix-blend-mode: overlay;
            }

            .liquid-card > .rounded-2xl {
              background-clip: padding-box;
              border: 1px solid rgba(255,255,255,0.05);
              background-image: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
              backdrop-filter: blur(10px) saturate(120%);
              -webkit-backdrop-filter: blur(10px) saturate(120%);
              box-shadow: 0 10px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.02);
            }

            /* moving sheen to emulate liquid movement */
            @keyframes sheenMove {
              0% { transform: translateX(-40%) skewX(-10deg); opacity: 0.05 }
              50% { transform: translateX(10%) skewX(-6deg); opacity: 0.14 }
              100% { transform: translateX(120%) skewX(-10deg); opacity: 0.05 }
            }

            .liquid-card > .rounded-2xl .glass-highlight {
              position: absolute;
              top: -20%;
              left: -40%;
              width: 200%;
              height: 90%;
              background: linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.0) 70%);
              pointer-events: none;
              mix-blend-mode: screen;
              filter: blur(6px) saturate(120%);
              transform: rotate(-12deg);
              animation: sheenMove 4.2s ease-in-out infinite;
            }

            /* small circular gloss near avatar */
            .liquid-card > .rounded-2xl .glass-dot {
              position: absolute;
              top: 12px;
              right: 22px;
              width: 46px;
              height: 46px;
              border-radius: 999px;
              background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), rgba(255,255,255,0.06) 40%, transparent 60%);
              pointer-events: none;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35) inset;
            }

            /* subtle inner vignette to enhance depth */
            .liquid-card > .rounded-2xl::after {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              box-shadow: inset 0 10px 30px rgba(0,0,0,0.18);
              pointer-events: none;
            }

            /* keep content above decorative layers */
            .liquid-card > .rounded-2xl > * { position: relative; z-index: 2; }
          `}</style>
          
          {userSummaries && userSummaries.length > 0 ? (
            userSummaries.map((s, idx) => (
              <div key={s.usuario?.id || idx} className="max-w-[440px]">
                <UserCard summary={s} />
              </div>
            ))
          ) : (
            projetos.slice(0,3).map((p, idx) => (
              <div key={idx} className="max-w-[440px]">
                <StatsCard title={p?.nome || 'Projeto'} value={`${p?.tarefasTotal ?? 0} tarefas`} subtitle={p?.descricao} />
              </div>
            ))
          )}
        </div>

        {/* Big chart area with performance card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Análise de Tarefas</h3>
                  <div className="text-sm text-gray-500">tarefas criadas • tarefas concluídas</div>
                </div>
                <div />
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-900 p-4">
                    <div style={{height:360}} className="w-full">
                      {chartSeries && chartSeries.length > 0 ? (
                        (() => {
                          const chartData = (() => {
                            try {
                              const s0 = chartSeries[0]?.data || []
                              const s1 = chartSeries[1]?.data || []
                              const labels = chartOptions?.xaxis?.categories || s0.map((_: any, i: number) => `#${i+1}`)
                              return labels.map((lab: any, i: number) => ({ x: lab, created: s0[i] || 0, completed: s1[i] || 0 }))
                            } catch (e) {
                              return []
                            }
                          })()

                          if (!chartData || chartData.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500">Nenhum dado disponível para o período selecionado</div>

                          return (
                            <ResponsiveContainer width="100%" height={360}>
                              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1}/>
                                  </linearGradient>
                                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
                                <XAxis dataKey="x" tick={{ fill: '#cbd5e1' }} />
                                <YAxis tick={{ fill: '#cbd5e1' }} />
                                <Tooltip wrapperStyle={{ color: '#000' }} formatter={(value: any, name: any) => {
                                  const label = name === 'created' ? 'Tarefas criadas' : name === 'completed' ? 'Tarefas finalizadas' : name
                                  return [value, label]
                                }} />
                                <Area type="monotone" dataKey="created" name="Tarefas criadas" stroke="#60a5fa" fill="url(#colorCreated)" strokeWidth={2} />
                                <Area type="monotone" dataKey="completed" name="Tarefas finalizadas" stroke="#34d399" fill="url(#colorCompleted)" strokeWidth={2} />
                                <Legend formatter={(value: any) => (value === 'created' ? 'Tarefas criadas' : value === 'completed' ? 'Tarefas finalizadas' : value)} />
                              </AreaChart>
                            </ResponsiveContainer>
                          )
                        })()
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">Nenhum dado disponível para o período selecionado</div>
                      )}
                    </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            {/* Performance card uses mocked/demo values for now. TODO: wire to real metrics in production */}
            {(() => {
              // Performance values derived from `stats` when available; fallback to zeros
              const perfMock = {
                score: stats?.taxaConclusao ?? 0,
                created: stats?.tarefasTotal ?? 0,
                closed: stats?.tarefasConcluidas ?? 0,
                progressPct: stats?.taxaConclusao ?? 0
              }
              return (
                <div className="sticky top-24 self-start liquid-card z-20">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-lime-400 to-green-400 text-black min-h-[460px] w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Performance</div>
                        <div className="text-xs opacity-80">Visão geral de tarefas</div>
                      </div>
                      <div className="text-2xl font-bold">{perfMock.score}</div>
                    </div>
                    <div className="mt-4">
                      <div className="bg-white/20 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Tarefas criadas</div>
                          <div className="text-lg font-bold">{perfMock.created}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Tarefas finalizadas</div>
                          <div className="text-lg font-bold">{perfMock.closed}</div>
                        </div>
                      </div>
                      <div className="h-3 bg-black/10 rounded-full mt-4 overflow-hidden">
                        <div style={{width: `${perfMock.progressPct}%`}} className="h-full bg-black/70" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Progresso Geral removed per UI request */}

        {/* Charts and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Status */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-align-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Tarefas por Status</h3>
            </div>
            <div className="space-y-3">
              {(() => {
                const order = ['concluida', 'em_progresso', 'pendente', 'cancelada']
                const labels: any = { 'pendente': 'Pendente', 'em_progresso': 'Em Progresso', 'concluida': 'Concluída', 'cancelada': 'Cancelada' }
                return order.map(status => {
                  const count = tasksByStatus[status] || 0
                  const percentage = stats?.tarefasTotal > 0 ? Math.round((count / stats.tarefasTotal) * 100) : 0
                  return (
                    <div key={status} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(status)}`}>
                            {labels[status]}
                          </span>
                          <span className="text-xs text-gray-500">{count} tasks</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</div>
                      </div>
                      <ProgressBar valor={percentage} className="h-2" />
                    </div>
                  )
                })
              })()}
            </div>
          </Card>

          {/* Tasks by Priority */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-align-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Tarefas por Prioridade</h3>
            </div>
            <div className="space-y-3">
              {(() => {
                const order = ['alta', 'media', 'baixa']
                const labels: any = { 'alta': 'Alta', 'media': 'Média', 'baixa': 'Baixa' }
                return order.map(prioridade => {
                  const count = tasksByPriority[prioridade] || 0
                  const percentage = stats?.tarefasTotal > 0 ? Math.round((count / stats.tarefasTotal) * 100) : 0
                  return (
                    <div key={prioridade} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium px-2 py-0.5 rounded ${getPriorityColor(prioridade)}`}>
                            {labels[prioridade]}
                          </span>
                          <span className="text-xs text-gray-500">{count} tarefas</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</div>
                      </div>
                      <ProgressBar valor={percentage} className="h-2" />
                    </div>
                  )
                })
              })()}
            </div>
          </Card>
        </div>

        {/* Projects section removed per UI request */}

        {/* Bottom Section: Recent Activities (Recent Tasks removed) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities removed per UI request */}
        </div>
      </div>
    </MainLayout>
  )
}
