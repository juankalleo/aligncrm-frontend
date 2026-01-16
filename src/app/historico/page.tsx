'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge, Avatar } from '@/components/ui/Elements'
import { RegistroHistorico, TipoAcao, EntidadeAuditada } from '@/tipos'
import { historicoServico } from '@/servicos/historicoServico'
import useProjetoStore from '@/contextos/ProjetoStore'

const acaoConfig: Record<TipoAcao, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
  'criar': { label: 'Criação', variant: 'success' },
  'atualizar': { label: 'Atualização', variant: 'info' },
  'excluir': { label: 'Exclusão', variant: 'error' },
  'arquivar': { label: 'Arquivamento', variant: 'warning' },
  'restaurar': { label: 'Restauração', variant: 'info' },
  'login': { label: 'Login', variant: 'info' },
  'logout': { label: 'Logout', variant: 'warning' },
  'permissao_alterada': { label: 'Permissão Alterada', variant: 'warning' },
}

const entidadeConfig: Record<EntidadeAuditada, { label: string; icon: React.ElementType }> = {
  'projeto': { label: 'Projeto', icon: FileText },
  'tarefa': { label: 'Tarefa', icon: Activity },
  'usuario': { label: 'Usuário', icon: User },
  'fluxograma': { label: 'Fluxograma', icon: Activity },
  'evento': { label: 'Evento', icon: Calendar },
  'arquivo': { label: 'Arquivo', icon: FileText },
  'link': { label: 'Link', icon: FileText },
}

const statusLabels: Record<string, string> = {
  'backlog': 'Backlog',
  'todo': 'A Fazer',
  'em_progresso': 'Em Progresso',
  'revisao': 'Em Revisão',
  'concluida': 'Concluída',
  'cancelada': 'Cancelada',
}

export default function HistoricoPage() {
  const [historicos, setHistoricos] = useState<RegistroHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [acaoFilter, setAcaoFilter] = useState<string>('todos')
  const [entidadeFilter, setEntidadeFilter] = useState<string>('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const projetoAtual = useProjetoStore(state => state.projetoAtual)

  useEffect(() => {
    carregarHistorico()
  }, [pagina, acaoFilter, entidadeFilter, dataInicio, dataFim, projetoAtual])

  const carregarHistorico = async () => {
    setLoading(true)
    try {
      let response
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null

      if (projetoAtual && projetoAtual.id) {
        response = await historicoServico.porProjeto(projetoAtual.id, pagina)
      } else if (workspaceId) {
        response = await historicoServico.porWorkspace(workspaceId, {
          pagina,
          acao: acaoFilter !== 'todos' ? acaoFilter : undefined,
          entidade: entidadeFilter !== 'todos' ? entidadeFilter : undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
        })
      } else {
        response = await historicoServico.listar({
          pagina,
          acao: acaoFilter !== 'todos' ? acaoFilter : undefined,
          entidade: entidadeFilter !== 'todos' ? entidadeFilter : undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
        })
      }

      setHistoricos(response.dados || response.data || [])
      setTotalPaginas(response.meta?.totalPaginas || response.meta?.total_paginas || 1)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarCSV = async () => {
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null

      const filtros: any = {
        acao: acaoFilter !== 'todos' ? acaoFilter : undefined,
        entidade: entidadeFilter !== 'todos' ? entidadeFilter : undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      }

      // If a project is selected, include projeto_id so backend can scope the export
      if (projetoAtual && projetoAtual.id) {
        filtros.projeto_id = projetoAtual.id
      }

      const blob = await historicoServico.exportar(filtros, !projetoAtual ? workspaceId ?? undefined : undefined)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historico_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatarMudancas = (mudancas: Record<string, any>) => {
    if (!mudancas) return null
    
    return Object.entries(mudancas).map(([campo, valores]) => (
      <div key={campo} className="text-xs mt-1">
        <span className="text-gray-500">{campo}:</span>{' '}
        <span className="text-red-500 line-through">{String(valores.antigo || '-')}</span>
        {' → '}
        <span className="text-green-500">{String(valores.novo || '-')}</span>
      </div>
    ))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Histórico de Atividades
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Audit log de todas as ações no sistema
            </p>
          </div>
          <Button onClick={exportarCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={acaoFilter}
              onChange={(e) => { setAcaoFilter(e.target.value); setPagina(1) }}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todas as ações</option>
              {Object.entries(acaoConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <select
              value={entidadeFilter}
              onChange={(e) => { setEntidadeFilter(e.target.value); setPagina(1) }}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todas as entidades</option>
              {Object.entries(entidadeConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setPagina(1) }}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 text-sm"
                title="Data inicial"
              />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setPagina(1) }}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 text-sm"
                title="Data final"
              />
            </div>
          </div>
        </Card>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : (historicos?.length ?? 0) === 0 ? (
          <Card className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum registro encontrado
            </h3>
            <p className="text-gray-500 mt-2">
              Tente ajustar os filtros de busca
            </p>
          </Card>
        ) : (
          <Card>
            <div className="space-y-0">
              {historicos.map((historico, index) => {
                const EntidadeIcon = entidadeConfig[historico.entidade]?.icon || Activity

                return (
                  <motion.div
                    key={historico.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {/* Timeline marker */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <EntidadeIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      {index < historicos.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={acaoConfig[historico.acao]?.variant || 'default'}>
                              {acaoConfig[historico.acao]?.label || historico.acao}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {entidadeConfig[historico.entidade]?.label || historico.entidade}
                            </span>
                            {historico.descricao && (
                              <span className="text-sm text-gray-500">
                                - {historico.descricao}
                              </span>
                            )}
                          </div>

                          {/* Mudanças */}
                          {historico.mudancas && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              {/* Special case: task status change -> readable move message */}
                              {historico.entidade === 'tarefa' && historico.mudancas.status ? (
                                (() => {
                                  const s = historico.mudancas.status
                                  const antigo = s.antigo
                                  const novo = s.novo
                                  return (
                                    <div className="text-sm mb-2">
                                      <span className="font-medium">{historico.usuario?.nome || 'Sistema'}</span>
                                      {' moveu a tarefa de '}
                                      <span className="font-medium">{statusLabels[antigo] || antigo}</span>
                                      {' para '}
                                      <span className="font-medium">{statusLabels[novo] || novo}</span>
                                      {'. '}<span className="text-xs text-gray-400">{formatarData(historico.criadoEm || (historico as any).created_at)}</span>
                                    </div>
                                  )
                                })()
                              ) : null}

                              {formatarMudancas(historico.mudancas)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {historico.usuario && (
                            <div className="flex items-center gap-2">
                              <Avatar nome={historico.usuario.nome} size="xs" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {historico.usuario.nome}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatarData(historico.criadoEm || (historico as any).created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
