"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import MainLayout from '@/layouts/MainLayout'
import { Card, ProgressBar, Avatar, Badge } from '@/components/ui/Elements'
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
  const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
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

          // Build monthly series for last 12 months: created vs completed
          try {
            const now = new Date()
            const months: string[] = []
            const createdCounts: number[] = []
            const completedCounts: number[] = []

            for (let i = 11; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
              const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' })
              months.push(monthLabel)
              const start = new Date(d.getFullYear(), d.getMonth(), 1)
              const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)

              const created = todas.filter((t: any) => {
                const c = t.criadoEm || t.created_at || t.criado_em
                if (!c) return false
                const cd = new Date(c)
                return cd >= start && cd < end
              }).length

              const completed = todas.filter((t: any) => {
                const status = (typeof t.status === 'string') ? t.status : (t.status && t.status.slug) || (t.status && t.status.nome) || t.status
                if (status !== 'concluida') return false
                const u = t.atualizadoEm || t.updated_at || t.atualizado_em || t.criadoEm
                if (!u) return false
                const ud = new Date(u)
                return ud >= start && ud < end
              }).length

              createdCounts.push(created)
              completedCounts.push(completed)
            }

            setChartSeries([
              { name: 'Created', data: createdCounts },
              { name: 'Completed', data: completedCounts }
            ])

            setChartOptions({
              chart: { toolbar: { show: false }, animations: { enabled: true }, foreColor: '#cbd5e1' },
              colors: ['#60a5fa', '#34d399'],
              xaxis: { categories: months },
              stroke: { curve: 'smooth' },
              grid: { borderColor: '#0f1724' },
              tooltip: { theme: 'dark' },
              legend: { position: 'top' },
            })
          } catch (e) {
            console.warn('Erro ao gerar séries do gráfico:', e)
          }

          // Helpers to normalize status and priority shapes
          const getStatus = (t: any) => {
            if (!t) return 'unknown'
            if (typeof t.status === 'string') return t.status
            if (t.status && typeof t.status === 'object') return t.status.slug || t.status.codigo || t.status.nome || (t.status.value && String(t.status.value)) || 'unknown'
            return t.status || 'unknown'
          }
          const getPriority = (t: any) => {
            if (!t) return 'media'
            if (typeof t.prioridade === 'string') return t.prioridade
            if (t.prioridade && typeof t.prioridade === 'object') return t.prioridade.slug || t.prioridade.nome || 'media'
            return t.prioridade || 'media'
          }

          const tarefasTotal = todas.length
          const tarefasConcluidas = todas.filter(t => getStatus(t) === 'concluida').length
          const tarefasEmProgresso = todas.filter(t => getStatus(t) === 'em_progresso').length
          const tarefasPendentes = todas.filter(t => getStatus(t) === 'pendente').length
          const tarefasAtrasadas = todas.filter(t => {
            if (t?.dataVencimento && getStatus(t) !== 'concluida') {
              const vencimento = new Date(t.dataVencimento)
              return vencimento < new Date()
            }
            return false
          }).length

          // Calculate task distributions
          const byStatus = todas.reduce((acc: Record<string, number>, t: any) => {
            const key = String(getStatus(t) || 'unknown')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByStatus(byStatus)

          const byPriority = todas.reduce((acc: Record<string, number>, t: any) => {
            const key = String(getPriority(t) || 'media')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByPriority(byPriority)

          // Helpers to extract user id from possible task shapes
          const getResponsavelId = (t: any) => t?.responsavel?.id || t?.responsavelId || t?.responsavel_id || null
          const getCriadorId = (t: any) => t?.criador?.id || t?.criadorId || t?.criador_id || null

          // Estimate members active by unique responsavel/creator ids in tasks
          const membroIds = new Set<string>()
          todas.forEach(t => {
            const r = getResponsavelId(t)
            const c = getCriadorId(t)
            if (r) membroIds.add(r)
            if (c) membroIds.add(c)
          })

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
    <MainLayout>
      <div className="space-y-6">
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
          {userSummaries && userSummaries.length > 0 ? userSummaries.map((s, idx) => {
            const u = s.usuario
            const colors = idx===0 ? 'from-blue-500 to-blue-400' : idx===1 ? 'from-slate-800 to-slate-700' : 'from-emerald-400 to-emerald-500'
            return (
              <motion.div key={u.id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} className={`rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br ${colors}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{u.nome}</div>
                    <div className="text-xs opacity-80 mt-1">{u.email || 'User'}</div>
                  </div>
                  <Avatar nome={u.nome} src={u.avatar || u.avatarUrl} tamanho="lg" />
                </div>
                <div className="mt-4">
                  <div className="text-sm">{s.done} out of {s.total} tasks completed</div>
                  <div className="mt-2"><ProgressBar valor={s.pct} className="h-2" /></div>
                </div>
              </motion.div>
            )
          }) : (
            // fallback to project members if no summaries
            projetos.slice(0,3).map((p, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} className={`rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br ${idx===0?'from-blue-500 to-blue-400':idx===1?'from-slate-800 to-slate-700':'from-emerald-400 to-emerald-500'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{p?.nome || 'Projeto'}</div>
                    <div className="text-xs opacity-80 mt-1">{p?.descricao || ''}</div>
                  </div>
                  <Avatar nome={p?.nome || 'P'} tamanho="lg" />
                </div>
                <div className="mt-4">
                  <div className="text-sm">{p?.tarefasTotal ?? 0} tarefas</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Big chart area with performance card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Tasks Analytics</h3>
                  <div className="text-sm text-gray-500">tasks created • tasks completed</div>
                </div>
                <div>
                  <select className="px-3 py-1 rounded bg-gray-100 dark:bg-slate-800 text-sm">
                    <option>Last year</option>
                    <option>Last 6 months</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-900 p-4">
                <div style={{height:360}} className="w-full">
                  {chartSeries && chartSeries.length > 0 ? (
                    // @ts-ignore react-apexcharts typings
                    <Chart options={chartOptions} series={chartSeries} type="area" height={360} />
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-lime-400 to-green-400 text-black">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Performance</div>
                      <div className="text-xs opacity-80">tasks overview</div>
                    </div>
                    <div className="text-2xl font-bold">{perfMock.score}</div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white/20 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Tasks created</div>
                        <div className="text-lg font-bold">{perfMock.created}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Tasks closed</div>
                        <div className="text-lg font-bold">{perfMock.closed}</div>
                      </div>
                    </div>
                    <div className="h-3 bg-black/10 rounded-full mt-4 overflow-hidden">
                      <div style={{width: `${perfMock.progressPct}%`}} className="h-full bg-black/70" />
                    </div>
                  </div>
                </motion.div>
              )
            })()}
          </div>
        </div>

        {/* Progress Bar */}
        {stats?.tarefasTotal > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progresso Geral
              </span>
              <span className="text-sm font-bold text-align-600">
                {stats.taxaConclusao || 0}%
              </span>
            </div>
            <ProgressBar 
              valor={stats.taxaConclusao || 0} 
              className="h-3"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{stats.tarefasConcluidas} concluídas</span>
              <span>{stats.tarefasTotal - stats.tarefasConcluidas} restantes</span>
            </div>
          </Card>
        )}

        {/* Charts and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Status */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-align-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Tarefas por Status
              </h3>
            </div>
            <div className="space-y-3">
              {Object.entries(tasksByStatus).map(([status, count]: [string, any]) => {
                const percentage = stats?.tarefasTotal > 0 
                  ? Math.round((count / stats.tarefasTotal) * 100) 
                  : 0
                const statusLabels: any = {
                  'pendente': 'Pendente',
                  'em_progresso': 'Em Progresso',
                  'concluida': 'Concluída',
                  'cancelada': 'Cancelada'
                }
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(status)}`}>
                        {statusLabels[status] || status}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <ProgressBar valor={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Tasks by Priority */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-align-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Tarefas por Prioridade
              </h3>
            </div>
            <div className="space-y-3">
              {Object.entries(tasksByPriority).map(([prioridade, count]: [string, any]) => {
                const percentage = stats?.tarefasTotal > 0 
                  ? Math.round((count / stats.tarefasTotal) * 100) 
                  : 0
                const prioridadeLabels: any = {
                  'alta': 'Alta',
                  'media': 'Média',
                  'baixa': 'Baixa'
                }
                return (
                  <div key={prioridade}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium px-2 py-1 rounded ${getPriorityColor(prioridade)}`}>
                        {prioridadeLabels[prioridade] || prioridade}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <ProgressBar valor={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Projects List (Workspace view only) */}
        {workspace && !projetoAtual && projetos.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban className="w-5 h-5 text-align-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Projetos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projetos.map(projeto => (
                <div 
                  key={projeto.id} 
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-align-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: projeto.cor || '#7c6be6' }}
                    >
                      {projeto.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {projeto.nome}
                      </h4>
                      {projeto.descricao && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {projeto.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bottom Section: Recent Tasks and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-align-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Tarefas Recentes</h3>
              </div>
              <Badge variante="info">{recentTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                recentTasks.map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {t.titulo}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(t.status)}`}>
                            {t.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(t.prioridade)}`}>
                            {t.prioridade}
                          </span>
                          {(t as any).dataVencimento && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date((t as any).dataVencimento).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activities */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-align-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Atividade Recente</h3>
              </div>
              <Badge variante="info">{recentActivities.length}</Badge>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma atividade recente
                </div>
              ) : (
                recentActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Avatar 
                      nome={a.usuario?.nome || 'Sistema'} 
                      tamanho="sm"
                      src={a.usuario?.avatarUrl}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{a.usuario?.nome || 'Sistema'}</span>
                        {' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          {a.acao || 'atualizou'}
                        </span>
                        {' '}
                        <span className="font-medium">{a.entidadeNome || a.entidade}</span>
                      </div>
                      {a.descricao && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {a.descricao}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(a.criadoEm || a.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
