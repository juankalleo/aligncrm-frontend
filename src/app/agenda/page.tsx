'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge, Avatar } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Evento, TipoEvento } from '@/tipos'
import { agendaServico } from '@/servicos/agendaServico'
import useProjetoStore from '@/contextos/ProjetoStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const eventoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['reuniao', 'prazo', 'lembrete', 'marco', 'outro']),
  data_inicio: z.string().min(1, 'Data de início obrigatória'),
  data_fim: z.string().optional(),
  local: z.string().optional(),
  cor: z.string().default('#6366f1'),
})

type EventoForm = z.infer<typeof eventoSchema>

const tipoConfig: Record<TipoEvento, { label: string; color: string }> = {
  'reuniao': { label: 'Reunião', color: 'bg-blue-500' },
  'prazo': { label: 'Prazo', color: 'bg-red-500' },
  'lembrete': { label: 'Lembrete', color: 'bg-yellow-500' },
  'marco': { label: 'Marco', color: 'bg-green-500' },
  'outro': { label: 'Outro', color: 'bg-purple-500' },
}

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function AgendaPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [dataAtual, setDataAtual] = useState(new Date())
  const [viewMode, setViewMode] = useState<'mes' | 'semana'>('mes')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      tipo: 'reuniao',
      cor: '#6366f1',
    }
  })

  const projetoAtual = useProjetoStore(state => state.projetoAtual)

  useEffect(() => {
    carregarEventos()
  }, [dataAtual, projetoAtual])

  const carregarEventos = async () => {
    setLoading(true)
    try {
      const inicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
      const fim = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0)
      
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      let eventosRes: any[] = []
      if (projetoAtual && projetoAtual.id) {
        eventosRes = await agendaServico.porProjeto(projetoAtual.id)
      } else if (workspaceId) {
        eventosRes = await agendaServico.porWorkspace(workspaceId)
      } else {
        // No workspace or project selected - show empty
        eventosRes = []
      }
      setEventos(eventosRes || [])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EventoForm) => {
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      
      // Ensure cor always has a valid value
      const eventoData = {
        ...data,
        cor: data.cor || '#6366f1'
      }
      
      if (editingEvento) {
        await agendaServico.atualizar(editingEvento.id, eventoData)
      } else {
        await agendaServico.criar(eventoData, workspaceId || undefined)
      }
      carregarEventos()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
    }
  }

  const excluirEvento = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await agendaServico.excluir(id)
        carregarEventos()
      } catch (error) {
        console.error('Erro ao excluir evento:', error)
      }
    }
  }

  const abrirModal = (evento?: Evento, data?: Date) => {
    if (evento) {
      setEditingEvento(evento)
      reset({
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        data_inicio: evento.data_inicio.split('T')[0] + 'T' + (evento.data_inicio.split('T')[1] || '09:00'),
        data_fim: evento.data_fim?.split('T')[0],
        local: evento.local,
        cor: evento.cor || '#6366f1',
      })
    } else {
      setEditingEvento(null)
      reset({
        tipo: 'reuniao',
        cor: '#6366f1',
        data_inicio: data ? data.toISOString().split('T')[0] + 'T09:00' : '',
      })
    }
    setModalOpen(true)
  }

  const fecharModal = () => {
    setModalOpen(false)
    setEditingEvento(null)
    reset()
  }

  const mesAnterior = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1))
  }

  const proximoMes = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1))
  }

  const irParaHoje = () => {
    setDataAtual(new Date())
  }

  // Gerar dias do calendário
  const gerarDiasCalendario = () => {
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()
    
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    
    const dias: { data: Date; atual: boolean; eventos: Evento[] }[] = []
    
    // Dias do mês anterior
    for (let i = primeiroDia.getDay(); i > 0; i--) {
      const data = new Date(ano, mes, 1 - i)
      dias.push({ data, atual: false, eventos: [] })
    }
    
    // Dias do mês atual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const data = new Date(ano, mes, i)
      const eventosData = eventos.filter(e => {
        const eventoData = new Date(e.data_inicio)
        return eventoData.toDateString() === data.toDateString()
      })
      dias.push({ data, atual: true, eventos: eventosData })
    }
    
    // Dias do próximo mês
    const diasRestantes = 42 - dias.length
    for (let i = 1; i <= diasRestantes; i++) {
      const data = new Date(ano, mes + 1, i)
      dias.push({ data, atual: false, eventos: [] })
    }
    
    return dias
  }

  const dias = gerarDiasCalendario()
  const hoje = new Date()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agenda
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie eventos e reuniões
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={irParaHoje}>
              Hoje
            </Button>
            <Button onClick={() => abrirModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Navegação do Calendário */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {meses[dataAtual.getMonth()]} {dataAtual.getFullYear()}
              </h2>
              <button
                onClick={proximoMes}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid do Calendário */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {/* Cabeçalho dos dias */}
              {diasSemana.map(dia => (
                <div 
                  key={dia}
                  className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-500"
                >
                  {dia}
                </div>
              ))}
              
              {/* Dias do mês */}
              {dias.map((dia, index) => {
                const isHoje = dia.data.toDateString() === hoje.toDateString()
                
                return (
                  <div
                    key={index}
                    onClick={() => abrirModal(undefined, dia.data)}
                    className={`bg-white dark:bg-gray-900 min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !dia.atual ? 'opacity-40' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isHoje
                        ? 'w-7 h-7 bg-align-500 text-white rounded-full flex items-center justify-center'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {dia.data.getDate()}
                    </div>
                    
                    {/* Eventos do dia */}
                    <div className="space-y-1">
                      {dia.eventos.slice(0, 3).map(evento => (
                        <div
                          key={evento.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirModal(evento)
                          }}
                          className={`text-xs p-1 rounded truncate text-white ${tipoConfig[evento.tipo].color}`}
                          title={evento.titulo}
                        >
                          {evento.titulo}
                        </div>
                      ))}
                      {dia.eventos.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dia.eventos.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Lista de Eventos do Mês */}
        {eventos.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Eventos do Mês
            </h3>
            <div className="space-y-3">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => abrirModal(evento)}
                >
                  <div className={`w-3 h-3 rounded-full ${tipoConfig[evento.tipo].color}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {evento.titulo}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                      </span>
                      {evento.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {evento.local}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge>{tipoConfig[evento.tipo].label}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal de Criar/Editar */}
        <Modal
          isOpen={modalOpen}
          onClose={fecharModal}
          title={editingEvento ? 'Editar Evento' : 'Novo Evento'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Título"
              {...register('titulo')}
              error={errors.titulo?.message}
              placeholder="Ex: Reunião de planejamento"
            />
            
            <Textarea
              label="Descrição"
              {...register('descricao')}
              placeholder="Detalhes do evento..."
              rows={3}
            />

            <Select
              label="Tipo"
              {...register('tipo')}
              options={Object.entries(tipoConfig).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data/Hora de Início"
                type="datetime-local"
                {...register('data_inicio')}
                error={errors.data_inicio?.message}
              />
              <Input
                label="Data de Término"
                type="date"
                {...register('data_fim')}
              />
            </div>

            <Input
              label="Local"
              {...register('local')}
              placeholder="Sala de reunião, Link do Meet..."
            />

            <Input
              label="Cor"
              type="color"
              {...register('cor')}
              className="h-10"
            />

            <div className="flex justify-end gap-3 pt-4">
              {editingEvento && (
                <Button 
                  type="button" 
                  variant="danger" 
                  onClick={() => {
                    excluirEvento(editingEvento.id)
                    fecharModal()
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingEvento ? 'Salvar' : 'Criar Evento'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}
