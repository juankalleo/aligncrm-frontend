"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/layouts'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/Form'
import {
  Card,
  Badge,
  PriorityBadge,
  Avatar,
  EmptyState,
} from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import tarefaServico from '@/servicos/tarefaServico'
import { usuarioServico } from '@/servicos/usuarioServico'
import { projetoServico } from '@/servicos/projetoServico'
import toast from 'react-hot-toast'
import { Tarefa, StatusTarefa, Usuario, Projeto } from '@/tipos'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useNotificacoes } from '@/contextos'

const statusOrder: StatusTarefa[] = [
  'backlog',
  'todo',
  'em_progresso',
  'revisao',
  'concluida',
]

const statusConfig: Record<StatusTarefa, { label: string }> = {
  backlog: { label: 'Backlog' },
  todo: { label: 'A Fazer' },
  em_progresso: { label: 'Em Progresso' },
  revisao: { label: 'Em Revisão' },
  concluida: { label: 'Concluída' },
  cancelada: { label: 'Cancelada' } as any,
}

const tarefaSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).optional(),
  responsavelId: z.string().optional(),
  projetoId: z.string().optional(),
  prazo: z.string().optional(),
})

type TarefaForm = z.infer<typeof tarefaSchema>

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tarefa | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [search, setSearch] = useState('')
  const { usuario } = useAuth()
  const { adicionarNotificacao } = useNotificacoes()

  const { register, handleSubmit, reset } = useForm<TarefaForm>({
    resolver: zodResolver(tarefaSchema),
  })

  useEffect(() => {
    carregarDados()
    carregarUsuarios()
    carregarProjetos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarUsuarios() {
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      let res
      if (workspaceId) {
        try {
          res = await usuarioServico.listarPorWorkspace(workspaceId, 1, 200)
        } catch (err) {
          // fallback to global list if workspace-scoped fails (403 for non-admins)
          res = await usuarioServico.listar(1, 200)
        }
      } else {
        res = await usuarioServico.listar(1, 200)
      }

      const dados = res.dados || []
      console.debug('carregarUsuarios -> fetched', dados.length, 'users')
      setUsuarios(dados)
    } catch (err) {
      console.error(err)
    }
  }

  async function carregarProjetos() {
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      if (workspaceId) {
        const res = await projetoServico.listarPorWorkspace(workspaceId, 1, 100)
        setProjetos(res.dados || [])
      } else {
        const res = await projetoServico.listar(1, 100)
        setProjetos(res.dados || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function carregarDados() {
    setLoading(true)
    try {
      const projetoId = typeof window !== 'undefined' ? localStorage.getItem('projetoId') : null
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null

      if (projetoId) {
        const res = await tarefaServico.listarPorProjeto(projetoId, 1, 1000, false)
        setTarefas(res.dados || [])
      } else if (workspaceId) {
        const res = await tarefaServico.listarPorWorkspace(workspaceId, 1, 1000, false)
        setTarefas(res.dados || [])
      } else {
        const res = await tarefaServico.listarMinhasTarefas(1, 1000)
        setTarefas(res.dados || [])
      }
    } catch (err) {
      console.error('Erro carregar tarefas', err)
      setTarefas([])
    } finally {
      setLoading(false)
    }
  }

  const tarefasFiltradas = useMemo(() => {
    if (!search) return tarefas
    return tarefas.filter((t) => t.titulo.toLowerCase().includes(search.toLowerCase()))
  }, [tarefas, search])

  function getTarefasPorStatus(status: StatusTarefa) {
    return tarefasFiltradas
      .filter((t) => t.status === status)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const sourceId = result.source.droppableId as StatusTarefa
    const destId = result.destination.droppableId as StatusTarefa
    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceId === destId && sourceIndex === destIndex) return

    const sourceTasks = getTarefasPorStatus(sourceId)
    const moved = sourceTasks[sourceIndex]
    if (!moved) return

    // Create updated task with new status
    const updatedTask = { ...moved, status: destId }
    
    // Update state immediately for smooth UI
    const newTarefas = tarefas.map(t => t.id === moved.id ? updatedTask : t)
    setTarefas(newTarefas)

    try {
      await tarefaServico.reordenar({ tarefaId: moved.id, novoStatus: destId, novaOrdem: destIndex })
      toast.success('Tarefa movida')
    } catch (err) {
      console.error('Erro ao persistir reordem/drag:', err)
      toast.error('Erro ao mover tarefa')
      carregarDados()
    }
  }

  function abrirModal(t?: Tarefa) {
    setEditing(t || null)
    // Refresh users before opening modal to ensure Responsável options are available
    carregarUsuarios()

    if (t) {
      reset({ 
        titulo: t.titulo, 
        descricao: t.descricao, 
        prioridade: t.prioridade, 
        responsavelId: t.responsavelId, 
        prazo: t.prazo,
        projetoId: t.projetoId 
      })
    } else {
      const projetoId = typeof window !== 'undefined' ? (localStorage.getItem('projetoId') || '') : ''
      reset({ titulo: '', descricao: '', projetoId })
    }
    setModalOpen(true)
  }

  function fecharModal() {
    setModalOpen(false)
    setEditing(null)
  }

  const onSave = handleSubmit(async (data) => {
    try {
      if (editing) {
        // normalize keys to snake_case for backend
        const payloadUpdate: any = {
          titulo: data.titulo,
          descricao: data.descricao,
          prioridade: data.prioridade,
          responsavel_id: data.responsavelId || null,
          projeto_id: data.projetoId || null,
          prazo: data.prazo,
        }

        await tarefaServico.atualizar(editing.id, payloadUpdate)
        toast.success('Tarefa atualizada')
      } else {
        const projetoId = typeof window !== 'undefined' ? (localStorage.getItem('projetoId') || '') : ''
        const payloadCreate: any = {
          titulo: data.titulo,
          descricao: data.descricao,
          prioridade: data.prioridade,
          responsavel_id: data.responsavelId || null,
          projeto_id: projetoId || null,
          prazo: data.prazo,
        }

        // If projeto_id is empty string, set to nil so backend treats as null
        if (!payloadCreate.projeto_id) delete payloadCreate.projeto_id

        const novaTarefa = await tarefaServico.criar(payloadCreate)
        toast.success('Tarefa criada')
        
        // Send notification to responsavel if assigned and not current user
        if (data.responsavelId && data.responsavelId !== usuario?.id) {
          adicionarNotificacao({
            tipo: 'tarefa',
            titulo: 'Nova tarefa atribuída',
            descricao: `Você foi atribuído à tarefa: ${data.titulo}`,
            link: '/tarefas',
          })
        }
      }
      fecharModal()
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar tarefa')
    }
  })

  async function handleArquivarConcluidas() {
    try {
      const projetoId = typeof window !== 'undefined' ? (localStorage.getItem('projetoId') || undefined) : undefined
      const workspaceId = typeof window !== 'undefined' ? (localStorage.getItem('workspaceId') || undefined) : undefined
      const count = await tarefaServico.arquivarConcluidas(projetoId, workspaceId)
      toast.success(`${count} tarefas arquivadas`)
      carregarDados()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao arquivar concluídas')
    }
  }

  return (
    <MainLayout searchValue={search} onSearchChange={(v) => setSearch(v)}>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Kanban</h2>
              <p className="text-sm text-light-muted dark:text-dark-muted">Organize suas tarefas por status. Arraste para mover entre colunas.</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variante="ghost" onClick={handleArquivarConcluidas} className="text-sm">Limpar concluídas</Button>
              <Button onClick={() => abrirModal()} variante="primary">Nova Tarefa</Button>
            </div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {statusOrder.map((status) => (
                <div key={status} className="min-h-[240px] w-[280px] flex-shrink-0">
                  <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-sm">{statusConfig[status].label}</h3>
                        <Badge className="text-xs">{getTarefasPorStatus(status).length}</Badge>
                      </div>
                      {status === 'concluida' && (
                        <div>
                          <Button onClick={handleArquivarConcluidas} variante="ghost" className="text-sm">Limpar</Button>
                        </div>
                      )}
                    </div>

                    <Droppable droppableId={status}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 px-0 flex-1 overflow-auto">
                          {getTarefasPorStatus(status).map((t, idx) => (
                            <Draggable key={t.id} draggableId={t.id} index={idx}>
                              {(dr) => (
                                <div ref={dr.innerRef} {...dr.draggableProps} {...dr.dragHandleProps}>
                                  <div 
                                    onClick={() => abrirModal(t)} 
                                    className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-align-400 dark:hover:border-align-600 group"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-semibold text-sm line-clamp-2 flex-1 group-hover:text-align-600 dark:group-hover:text-align-400 transition-colors">{t.titulo}</h4>
                                        <PriorityBadge prioridade={t.prioridade as any} />
                                      </div>
                                      
                                      {t.descricao && (
                                        <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2">{t.descricao}</p>
                                      )}
                                      
                                      <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border">
                                        <div className="flex items-center gap-2">
                                          {t.responsavel ? (
                                            <div className="flex items-center gap-2">
                                              <Avatar nome={t.responsavel.nome} src={t.responsavel.avatar} tamanho="sm" />
                                              <span className="text-xs text-light-text dark:text-dark-text truncate max-w-[100px]">{t.responsavel.nome.split(' ')[0]}</span>
                                            </div>
                                          ) : (
                                            <div className="text-xs text-light-muted dark:text-dark-muted">Não atribuído</div>
                                          )}
                                        </div>
                                        {t.prazo && (
                                          <div className="text-xs text-light-muted dark:text-dark-muted bg-light-hover dark:bg-dark-hover px-2 py-1 rounded">
                                            {new Date(t.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {getTarefasPorStatus(status).length === 0 && (
                            <div className="mt-3">
                              <EmptyState titulo="Nenhuma tarefa" descricao="Arraste tarefas para cá ou crie uma nova." acao={<Button onClick={() => abrirModal()}>Criar Tarefa</Button>} />
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={fecharModal} titulo={editing ? 'Editar Tarefa' : 'Nova Tarefa'}>
        <form onSubmit={onSave} className="space-y-4">
          <Input label="Título" {...register('titulo')} placeholder="Digite o título da tarefa" />
          <Textarea label="Descrição" {...register('descricao')} rows={3} placeholder="Descreva os detalhes da tarefa" />
          
          <div className="grid grid-cols-2 gap-3">
            <Select label="Prioridade" {...register('prioridade')}>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
            <Input label="Prazo" type="date" {...register('prazo')} />
          </div>
          
          <Select label="Projeto" {...register('projetoId')}>
            <option value="">Sem projeto</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
          
          <Select label="Responsável" {...register('responsavelId')}>
            <option value="">Não atribuído</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variante="secondary" onClick={fecharModal} type="button">
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  )
}