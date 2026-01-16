"use client"

import React, { useEffect, useState } from 'react'
import MainLayout from '@/layouts/MainLayout'
import { Card, ProgressBar, Avatar, Badge } from '@/components/ui/Elements'
import { Button } from '@/components/ui'
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
import StorageIndicator from '@/components/workspace/StorageIndicator'

export default function DashboardPage() {
  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any | null>(null)
  const [workspace, setWorkspace] = useState<any | null>(null)
  const [projetos, setProjetos] = useState<any[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, number>>({})
  const [tasksByPriority, setTasksByPriority] = useState<Record<string, number>>({})

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

          const tarefasTotal = todas.length
          const tarefasConcluidas = todas.filter(t => (t as any).status === 'concluida').length
          const tarefasEmProgresso = todas.filter(t => (t as any).status === 'em_progresso').length
          const tarefasPendentes = todas.filter(t => (t as any).status === 'pendente').length
          const tarefasAtrasadas = todas.filter(t => {
            if ((t as any).dataVencimento && (t as any).status !== 'concluida') {
              const vencimento = new Date((t as any).dataVencimento)
              return vencimento < new Date()
            }
            return false
          }).length

          // Calculate task distributions
          const byStatus = todas.reduce((acc: Record<string, number>, t: any) => {
            const key = String(t.status || 'unknown')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByStatus(byStatus)

          const byPriority = todas.reduce((acc: Record<string, number>, t: any) => {
            const key = String(t.prioridade || 'media')
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          setTasksByPriority(byPriority)

          // Estimate members active by unique responsavel/creator ids in tasks
          const membroIds = new Set<string>()
          todas.forEach(t => {
            if ((t as any).responsavelId) membroIds.add((t as any).responsavelId)
            if ((t as any).criadorId) membroIds.add((t as any).criadorId)
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

        {/* Storage Indicator - Only for workspace view */}
        {workspace && !projetoAtual && (
          <StorageIndicator workspace={workspace} />
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Tarefas</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.tarefasTotal ?? 0}
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Completed Tasks */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Concluídas</div>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.tarefasConcluidas ?? 0}
                </div>
                {stats?.taxaConclusao !== undefined && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stats.taxaConclusao}% concluído
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          {/* In Progress */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Em Progresso</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats?.tarefasEmProgresso ?? 0}
                </div>
                {stats?.tarefasAtrasadas !== undefined && stats.tarefasAtrasadas > 0 && (
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {stats.tarefasAtrasadas} atrasadas
                  </div>
                )}
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          {/* Active Members or Projects */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {workspace && !projetoAtual ? 'Projetos Ativos' : 'Membros Ativos'}
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {workspace && !projetoAtual ? stats?.projetosTotal ?? 0 : stats?.membrosAtivos ?? 0}
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                {workspace && !projetoAtual ? (
                  <FolderKanban className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                )}
              </div>
            </div>
          </Card>
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
