'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  MoreHorizontal,
  Calendar,
  Users,
  FolderOpen
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge, Avatar, ProgressBar } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Projeto, StatusProjeto } from '@/tipos'
import { projetoServico } from '@/servicos/projetoServico'
import { useAuth, useNotificacoes } from '@/contextos'
import toast from 'react-hot-toast'
import { usuarioServico } from '@/servicos/usuarioServico'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const projetoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado']),
  cor: z.string().default('#6366f1'),
  data_inicio: z.string().optional(),
  data_fim_prevista: z.string().optional(),
})

type ProjetoForm = z.infer<typeof projetoSchema>

const statusConfig: Record<StatusProjeto, { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
  'planejamento': { label: 'Planejamento', variant: 'info' },
  'em_andamento': { label: 'Em Andamento', variant: 'warning' },
  'concluido': { label: 'Concluído', variant: 'success' },
  'pausado': { label: 'Pausado', variant: 'default' },
  'cancelado': { label: 'Cancelado', variant: 'error' },
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjetoForm>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      status: 'planejamento',
      cor: '#6366f1',
    }
  })

  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [usuariosLoading, setUsuariosLoading] = useState(false)
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const { usuario } = useAuth()
  const { adicionarNotificacao } = useNotificacoes()
  const podeGerenciarSolicitacoes = usuario?.role === 'admin' || usuario?.role === 'manager'
  const [membrosSelecionados, setMembrosSelecionados] = useState<string[]>([])
  const [membrosDropdownOpen, setMembrosDropdownOpen] = useState(false)
  const toggleMembro = (id: string | number) => {
    const sid = String(id)
    setMembrosSelecionados(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  const loadUsuariosIfNeeded = async () => {
    if (usuarios && usuarios.length > 0) return
    setUsuariosLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      let res
      if (workspaceId) {
        try {
          res = await usuarioServico.listarPorWorkspace(workspaceId)
        } catch (err) {
          console.warn('listarPorWorkspace falhou, tentando listar globalmente', err)
          res = await usuarioServico.listar()
        }
      } else {
        res = await usuarioServico.listar()
      }
      setUsuarios(res.dados || [])
    } catch (err) {
      console.error('Erro ao carregar usuários para o dropdown:', err)
      setUsuarios([])
    } finally {
      setUsuariosLoading(false)
    }
  }
  const [gerenciandoMembros, setGerenciandoMembros] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (capaPreview) URL.revokeObjectURL(capaPreview)
    }
  }, [capaPreview])

  useEffect(() => {
    carregarProjetos()
  }, [])

  const carregarProjetos = async () => {
    setLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      const [response, usuariosRes] = await Promise.all([
        workspaceId ? projetoServico.listarPorWorkspace(workspaceId) : projetoServico.listar(),
        workspaceId ? usuarioServico.listarPorWorkspace(workspaceId) : usuarioServico.listar(),
      ])
      console.log('[ProjetosPage] listar response:', response)

      // Normalize possible response shapes
      let dados = response.dados
      if (!dados) {
        // maybe API returned object with root 'data' or single object
        if ((response as any).data) dados = (response as any).data
        else if ((response as any).projeto) dados = [(response as any).projeto]
      }

      if (Array.isArray(dados)) setProjetos(dados)
      else if (dados) setProjetos([dados])
      else setProjetos([])
      setUsuarios(usuariosRes.dados || [])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      setProjetos([])
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    if (sourceIndex === destIndex) return

    const reordered = Array.from(projetos)
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(destIndex, 0, moved)
    setProjetos(reordered)

    // persist order to backend
    try {
      const ids = reordered.map(p => p.id)
      await projetoServico.reordenar(ids)
    } catch (err) {
      console.error('Erro ao persistir ordem dos projetos:', err)
    }
  }

  const onSubmit = async (data: ProjetoForm) => {
    try {
      if (editingProjeto) {
        // if editing and a new capa file was selected, send as FormData
        if (capaFile) {
          const fd = new FormData()
          fd.append('nome', data.nome)
          if (data.descricao) fd.append('descricao', data.descricao)
          if (data.observacoes) fd.append('observacoes', data.observacoes)
          fd.append('status', data.status)
          if (data.data_inicio) fd.append('data_inicio', data.data_inicio)
          if (data.data_fim_prevista) fd.append('data_fim', data.data_fim_prevista)
          if (data.cor) fd.append('cor', data.cor)
          fd.append('capa', capaFile)
          // append members ids if any
          membrosSelecionados.forEach(id => fd.append('membros_ids[]', id))

          const atualizado = await projetoServico.atualizar(editingProjeto.id, fd)
          // update local list and preview map
          setProjetos(prev => prev.map(p => p.id === atualizado.id ? atualizado : p))
          if (atualizado && (atualizado as any).id && capaPreview) {
            setPreviews(prev => ({ ...prev, [(atualizado as any).id]: capaPreview }))
          }
        } else {
          await projetoServico.atualizar(editingProjeto.id, data)
          // update members if any
          if (membrosSelecionados.length > 0) {
            await projetoServico.atualizar(editingProjeto.id, { membrosIds: membrosSelecionados })
          }
          carregarProjetos()
        }
      } else {
        // If there's a file selected, send as FormData
        if (capaFile) {
          const fd = new FormData()
          fd.append('nome', data.nome)
          if (data.descricao) fd.append('descricao', data.descricao)
          if (data.observacoes) fd.append('observacoes', data.observacoes)
          fd.append('status', data.status)
          if (data.data_inicio) fd.append('data_inicio', data.data_inicio)
          if (data.data_fim_prevista) fd.append('data_fim', data.data_fim_prevista)
          if (data.cor) fd.append('cor', data.cor)
          fd.append('capa', capaFile)
          membrosSelecionados.forEach(id => fd.append('membros_ids[]', id))

          const novo = await projetoServico.criar(fd)
          // attach preview locally so it shows immediately (per project id)
          if (novo && (novo as any).id && capaPreview) {
            setPreviews(prev => ({ ...prev, [(novo as any).id]: capaPreview }))
          }
          setProjetos(prev => [...prev, novo])
        } else {
          const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
          const novo = await projetoServico.criar({
            nome: data.nome,
            descricao: data.descricao,
            observacoes: data.observacoes,
            status: data.status,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim_prevista,
            cor: data.cor || '#7c6be6',
            workspace_id: workspaceId,
            membrosIds: membrosSelecionados,
          })
          setProjetos(prev => [...prev, novo])
        }
        // If we didn't upload a file, refetch to populate backend-generated fields
        if (!capaFile) {
          carregarProjetos()
        } else {
          // If we uploaded a file but backend didn't return `capa_url`, refetch to ensure persistence
          const last = projetos[projetos.length - 1]
          if (!last || !(last as any).capa_url) {
            carregarProjetos()
          }
        }
      }
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
    }
  }

  const excluirProjeto = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await projetoServico.excluir(id)
        carregarProjetos()
      } catch (error) {
        console.error('Erro ao excluir projeto:', error)
      }
    }
  }

  const abrirModal = async (projeto?: Projeto) => {
    if (projeto) {
      setEditingProjeto(projeto)
      reset({
        nome: projeto.nome,
        descricao: projeto.descricao,
        status: projeto.status,
        cor: projeto.cor || '#7c6be6',
        data_inicio: projeto.data_inicio,
        data_fim_prevista: projeto.data_fim_prevista,
      })
      // set selected members (normalize ids to strings for the select value)
      setMembrosSelecionados(projeto.membros?.map(m => String((m as any).id)) || [])
      // load pending solicitations for this project
      try {
        const dados = await projetoServico.listarSolicitacoes(projeto.id)
        setSolicitacoes(dados || [])
      } catch (err) {
        console.error('Erro ao carregar solicitações:', err)
        setSolicitacoes([])
      }
    } else {
      setEditingProjeto(null)
      reset({
        status: 'planejamento',
        cor: '#7c6be6',
      })
      setMembrosSelecionados([])
      // ensure users are loaded so the members multi-select has options
      if (!usuarios || usuarios.length === 0) {
        try {
          const res = await usuarioServico.listar()
          setUsuarios(res.dados || [])
        } catch (err) {
          console.error('Erro ao carregar usuários para o modal:', err)
        }
      }
    }
    setModalOpen(true)
  }

  const fecharModal = () => {
    setModalOpen(false)
    setEditingProjeto(null)
    reset()
    setCapaFile(null)
    setCapaPreview(null)
  }

  const adicionarMembroAoProjeto = async (projetoId: string, usuarioId: string) => {
    try {
      await projetoServico.adicionarMembro(projetoId, usuarioId)
      toast.success('Membro adicionado')
      
      // Send notification to added member if not current user
      if (usuarioId !== usuario?.id) {
        const projeto = projetos.find(p => p.id === projetoId)
        if (projeto) {
          adicionarNotificacao({
            tipo: 'projeto',
            titulo: 'Adicionado a um projeto',
            descricao: `Você foi adicionado ao projeto: ${projeto.nome}`,
            link: '/projetos',
          })
        }
      }
      
      carregarProjetos()
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
      toast.error('Erro ao adicionar membro')
    }
  }

  const removerMembroDoProjeto = async (projetoId: string, usuarioId: string) => {
    try {
      await projetoServico.removerMembro(projetoId, usuarioId)
      toast.success('Membro removido')
      carregarProjetos()
    } catch (err) {
      console.error('Erro ao remover membro:', err)
      toast.error('Erro ao remover membro')
    }
  }

  const projetosFiltrados = (projetos || []).filter(projeto => {
    const matchSearch = projeto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'todos' || projeto.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <MainLayout searchValue={searchTerm} onSearchChange={(v) => setSearchTerm(v)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projetos</h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todos os status</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-align-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-align-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={() => abrirModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Filters moved to header; search is handled by the global header */}

        {/* Lista de Projetos */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : projetosFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro projeto'}
            </p>
            {!searchTerm && statusFilter === 'todos' && (
              <Button onClick={() => abrirModal()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Projeto
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="projetos">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projetosFiltrados.map((projeto, index) => (
                    <Draggable key={projeto.id} draggableId={projeto.id} index={index}>
                      {(providedDr) => (
                        <div
                          ref={providedDr.innerRef}
                          {...providedDr.draggableProps}
                          {...providedDr.dragHandleProps}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card 
                              className="h-full hover:shadow-lg transition-shadow"
                            >
                  {((projeto as any).capa_url || previews[projeto.id]) && (
                    <div className="w-full h-36 mb-4 overflow-hidden rounded-t-lg cursor-pointer" onClick={() => abrirModal(projeto)}>
                      <img src={(projeto as any).capa_url || previews[projeto.id]} alt="Capa do projeto" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-end mb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        excluirProjeto(projeto.id)
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="cursor-pointer" onClick={() => abrirModal(projeto)}>
                    <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-1">
                      {projeto.nome}
                    </h3>
                    {projeto.descricao && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {projeto.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={statusConfig[projeto.status].variant}>
                        {statusConfig[projeto.status].label}
                      </Badge>
                    </div>

                    <ProgressBar 
                      value={projeto.progresso || 0} 
                      max={100}
                      className="mb-4"
                    />

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{projeto.data_fim_prevista || 'Sem prazo'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <List className="w-4 h-4" />
                          <span>{(projeto as any).tarefasTotal ?? (projeto as any).tarefas_total ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Membros ({projeto.membros?.length || 0})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGerenciandoMembros(gerenciandoMembros === projeto.id ? null : projeto.id)
                        }}
                        className="text-xs text-align-600 hover:text-align-700 font-medium"
                      >
                        {gerenciandoMembros === projeto.id ? 'Fechar' : 'Gerenciar'}
                      </button>
                    </div>

                    {gerenciandoMembros === projeto.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        {/* Current members */}
                        {projeto.membros && projeto.membros.length > 0 && (
                          <div className="space-y-1">
                            {projeto.membros.map((membro: any) => (
                              <div key={membro.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <Avatar nome={membro.nome} src={membro.avatar} tamanho="sm" />
                                  <span className="text-sm">{membro.nome}</span>
                                </div>
                                <button
                                  onClick={() => removerMembroDoProjeto(projeto.id, membro.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add member dropdown */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Adicionar membro</label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                adicionarMembroAoProjeto(projeto.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            className="w-full px-2 py-1.5 text-sm rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          >
                            <option value="">Selecione um usuário</option>
                            {usuarios.filter(u => !projeto.membros?.some((m: any) => m.id === u.id)).map(u => (
                              <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex -space-x-2">
                        {projeto.membros?.slice(0, 5).map((membro: any) => (
                          <Avatar key={membro.id} nome={membro.nome} src={membro.avatar} tamanho="sm" />
                        ))}
                        {projeto.membros && projeto.membros.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            +{projeto.membros.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                            </Card>
                          </motion.div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <Card>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {projetosFiltrados.map((projeto) => (
                <div 
                  key={projeto.id}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 -mx-4 cursor-pointer"
                  onClick={() => abrirModal(projeto)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: projeto.cor + '20' }}
                    >
                      <FolderOpen 
                        className="w-5 h-5" 
                        style={{ color: projeto.cor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {projeto.nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {projeto.descricao?.substring(0, 50) || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={statusConfig[projeto.status].variant}>
                      {statusConfig[projeto.status].label}
                    </Badge>
                    <span className="text-sm text-gray-500">{projeto.progresso || 0}%</span>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <List className="w-4 h-4" />
                      <span>{(projeto as any).tarefasTotal ?? (projeto as any).tarefas_total ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal de Criar/Editar */}
        <Modal
          isOpen={modalOpen}
          onClose={fecharModal}
          title={editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}
          tamanho="full"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Nome do Projeto"
                {...register('nome')}
                error={errors.nome?.message}
                placeholder="Ex: Website Corporativo"
              />

              <Select
                label="Status"
                {...register('status')}
                options={Object.entries(statusConfig).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data de Início"
                  type="date"
                  {...register('data_inicio')}
                />
                <Input
                  label="Data Prevista de Término"
                  type="date"
                  {...register('data_fim_prevista')}
                />
              </div>

              <Input
                label="Cor do Projeto"
                type="color"
                {...register('cor')}
                className="h-10"
              />
            </div>

            <div className="space-y-4">
              <Textarea
                label="Descrição"
                {...register('descricao')}
                placeholder="Descreva o projeto..."
                rows={4}
              />

              <Textarea
                label="Observações"
                {...register('observacoes')}
                placeholder="Anotações internas ou comentários sobre o projeto"
                rows={4}
              />

              <div>
                <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Membros</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!membrosDropdownOpen) await loadUsuariosIfNeeded()
                      setMembrosDropdownOpen(open => !open)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text text-sm flex items-center justify-between"
                  >
                    <span className="truncate">
                      {membrosSelecionados.length === 0 ? 'Selecione membros' : `${membrosSelecionados.length} selecionado(s)`}
                    </span>
                    <span className="text-xs text-gray-500">▾</span>
                  </button>

                  {membrosDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md max-h-56 overflow-auto p-2">
                      {usuariosLoading ? (
                        <div className="text-sm text-gray-500 p-2">Carregando usuários...</div>
                      ) : usuarios.length === 0 ? (
                        <div className="text-sm text-gray-500 p-2">Nenhum usuário</div>
                      ) : (
                        usuarios.map(u => {
                          const checked = membrosSelecionados.includes(String(u.id))
                          return (
                            <label key={u.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  toggleMembro(u.id)
                                }}
                                className="w-4 h-4"
                              />
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{u.nome}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {solicitacoes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Pedidos de Acesso</label>
                  <div className="space-y-2">
                                  {solicitacoes.filter(s => s.status === 'pendente').map(s => (
                                  <div key={s.id} className="flex items-center justify-between p-3 bg-light-card dark:bg-dark-card rounded border-light-border">
                        <div>
                          <div className="font-medium">{s.usuario.nome} <span className="text-xs text-light-muted">({s.usuario.email})</span></div>
                          {s.mensagem && <div className="text-sm text-light-muted">{s.mensagem}</div>}
                        </div>
                        {podeGerenciarSolicitacoes && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                  try {
                                  await projetoServico.atualizarSolicitacao(editingProjeto!.id, s.id, 'aprovado')
                                  toast.success('Solicitação aprovada')
                                  // refresh members and solicitacoes
                                  await carregarProjetos()
                                  const dados = await projetoServico.listarSolicitacoes(editingProjeto!.id)
                                  setSolicitacoes(dados || [])
                                } catch (err) {
                                  console.error('Erro ao aprovar solicitacao', err)
                                  toast.error('Erro ao aprovar solicitação')
                                }
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded"
                            >Aceitar</button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await projetoServico.atualizarSolicitacao(editingProjeto!.id, s.id, 'rejeitado')
                                  toast.success('Solicitação rejeitada')
                                  const dados = await projetoServico.listarSolicitacoes(editingProjeto!.id)
                                  setSolicitacoes(dados || [])
                                } catch (err) {
                                  console.error('Erro ao rejeitar solicitacao', err)
                                  toast.error('Erro ao rejeitar solicitação')
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded"
                            >Rejeitar</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capa (imagem)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setCapaFile(f)
                    if (f) {
                      const url = URL.createObjectURL(f)
                      setCapaPreview(url)
                    } else {
                      setCapaPreview(null)
                    }
                  }}
                />

                {capaPreview && (
                  <div className="mt-3 w-full h-36 bg-gray-100 rounded overflow-hidden">
                    <img src={capaPreview} alt="Capa preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProjeto ? 'Salvar' : 'Criar Projeto'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
