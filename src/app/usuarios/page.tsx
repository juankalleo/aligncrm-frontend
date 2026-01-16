'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Users
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge, Avatar } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Form'
import { Usuario, Role } from '@/tipos'
import { usuarioServico } from '@/servicos/usuarioServico'
import { useAuth } from '@/contextos'
import toast from 'react-hot-toast'
import { projetoServico } from '@/servicos'
import useProjetoStore from '@/contextos/ProjetoStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { workspaceServico } from '@/servicos/workspaceServico'
import { Workspace } from '@/tipos'

const usuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'user', 'viewer']),
  ativo: z.boolean().default(true),
})

type UsuarioForm = z.infer<typeof usuarioSchema>

const roleConfig: Record<Role, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  'admin': { label: 'Administrador', variant: 'success' },
  'manager': { label: 'Gerente', variant: 'warning' },
  'user': { label: 'Usuário', variant: 'info' },
  'viewer': { label: 'Visualizador', variant: 'default' },
}

export default function UsuariosPage() {
  const { usuario: usuarioAtual } = useAuth()
  const isAdmin = usuarioAtual?.role === 'admin'
  const isManager = usuarioAtual?.role === 'manager'
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [editandoWorkspace, setEditandoWorkspace] = useState(false)
  const [nomeWorkspace, setNomeWorkspace] = useState('')
  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const selecionarProjeto = useProjetoStore(state => state.selecionarProjeto)
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const usuario = usuarioAtual
  const podeGerenciarSolicitacoes = usuario?.role === 'admin' || usuario?.role === 'manager'
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('todos')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteExpires, setInviteExpires] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      role: 'user',
      ativo: true,
    }
  })

  useEffect(() => {
    carregarUsuarios()
    carregarWorkspace()
  }, [])

  const carregarWorkspace = async () => {
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
    if (workspaceId) {
      try {
        const ws = await workspaceServico.buscarPorId(workspaceId)
        setWorkspace(ws)
        setNomeWorkspace(ws.nome)
      } catch (error) {
        console.error('Erro ao carregar workspace:', error)
      }
    }
  }

  useEffect(() => {
    const carregarSolicitacoes = async () => {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      
      if (!projetoAtual && !workspaceId) {
        setSolicitacoes([])
        return
      }

      try {
        let dados
        if (projetoAtual) {
          dados = await projetoServico.listarSolicitacoes(projetoAtual.id)
        } else if (workspaceId) {
          dados = await projetoServico.listarSolicitacoesPorWorkspace(workspaceId)
        }
        setSolicitacoes(dados || [])
      } catch (err) {
        console.error('Erro ao carregar solicitações:', err)
        setSolicitacoes([])
      }
    }

    carregarSolicitacoes()
  }, [projetoAtual])

  const carregarUsuarios = async () => {
    setLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      
      // List users from workspace if selected, otherwise all users (admin only)
      const response = workspaceId 
        ? await usuarioServico.listarPorWorkspace(workspaceId)
        : await usuarioServico.listar()
      console.debug('usuarioServico response:', response)
      setUsuarios(response.dados || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: UsuarioForm) => {
    try {
      if (editingUsuario) {
        // Check if role changed
        const roleChanged = data.role !== editingUsuario.role
        
        const updateData: any = {
          nome: data.nome,
          email: data.email,
          ativo: data.ativo
        }
        
        // Only include password if provided
        if (data.senha && data.senha.length > 0) {
          updateData.senha = data.senha
        }
        
        // Update basic info first
        await usuarioServico.atualizar(editingUsuario.id, updateData)
        
        // If role changed, update it separately using the specific endpoint
        if (roleChanged) {
          await usuarioServico.alterarRole(editingUsuario.id, data.role)
        }
        
        toast.success('Usuário atualizado com sucesso')
      } else {
        await usuarioServico.criar(data)
        toast.success('Usuário criado com sucesso')
      }
      carregarUsuarios()
      fecharModal()
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error?.message || 'Erro ao salvar usuário')
    }
  }

  const excluirUsuario = async (id: string) => {
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
    const mensagem = workspaceId 
      ? 'Tem certeza que deseja remover este usuário do workspace?' 
      : 'Tem certeza que deseja desativar este usuário?'
    
    if (confirm(mensagem)) {
      try {
        if (workspaceId) {
          // Remove user from workspace (removes from all projects in workspace)
          await usuarioServico.removerDoWorkspace(workspaceId, id)
        } else {
          // Global deactivation (admin only)
          await usuarioServico.desativar(id)
        }
        carregarUsuarios()
      } catch (error) {
        console.error('Erro ao remover usuário:', error)
      }
    }
  }

  const toggleAtivo = async (usuario: Usuario) => {
    try {
      await usuarioServico.atualizar(usuario.id, { ativo: !usuario.ativo })
      carregarUsuarios()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario)
      reset({
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
      })
    } else {
      setEditingUsuario(null)
      reset({
        role: 'user',
        ativo: true,
      })
    }
    setModalOpen(true)
  }

  const fecharModal = () => {
    setModalOpen(false)
    setEditingUsuario(null)
    reset()
  }

  const fecharInviteModal = () => {
    setInviteModalOpen(false)
    setInviteLink(null)
    setInviteExpires(null)
  }

  const salvarNomeWorkspace = async () => {
    if (!workspace || !nomeWorkspace.trim()) return
    
    try {
      const updated = await workspaceServico.atualizar(workspace.id, { nome: nomeWorkspace })
      setWorkspace(updated)
      setEditandoWorkspace(false)
      toast.success('Nome do workspace atualizado com sucesso')
    } catch (error: any) {
      console.error('Erro ao atualizar workspace:', error)
      toast.error(error?.message || 'Erro ao atualizar workspace')
    }
  }

  const cancelarEdicaoWorkspace = () => {
    setNomeWorkspace(workspace?.nome || '')
    setEditandoWorkspace(false)
  }

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'todos' || usuario.role === roleFilter
    return matchSearch && matchRole
  })

  const estatisticas = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    gerentes: usuarios.filter(u => u.role === 'manager').length,
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Workspace Info - Only show if workspace selected and user is admin */}
        {workspace && isAdmin && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {editandoWorkspace ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nomeWorkspace}
                      onChange={(e) => setNomeWorkspace(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 focus:border-transparent"
                      placeholder="Nome do workspace"
                    />
                    <Button 
                      onClick={salvarNomeWorkspace}
                      disabled={!nomeWorkspace.trim()}
                      tamanho="sm"
                    >
                      Salvar
                    </Button>
                    <Button 
                      onClick={cancelarEdicaoWorkspace}
                      variante="secondary"
                      tamanho="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {workspace.nome}
                      </h2>
                      <p className="text-sm text-gray-500">Workspace atual</p>
                    </div>
                    <button
                      onClick={() => setEditandoWorkspace(true)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Editar nome do workspace"
                    >
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Usuários
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie usuários e permissões
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isManager) && (
              <>
                <Button onClick={() => abrirModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
                {workspace && (isAdmin || isManager) && (
                  <Button variante="ghost" onClick={async () => {
                    try {
                      const data = await workspaceServico.criarConvite(workspace.id)
                      const token = data.token
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      const link = `${origin}/registro?invite=${token}`
                      setInviteLink(link)
                      setInviteExpires(data.expires_at)
                      setInviteModalOpen(true)
                    } catch (err) {
                      console.error('Erro ao criar convite', err)
                      toast.error('Erro ao gerar convite')
                    }
                  }}>
                    Gerar Convite
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <Users className="w-8 h-8 mx-auto text-align-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.total}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </Card>
          <Card className="text-center">
            <UserCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.ativos}
            </div>
            <div className="text-sm text-gray-500">Ativos</div>
          </Card>
          <Card className="text-center">
            <Shield className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.admins}
            </div>
            <div className="text-sm text-gray-500">Admins</div>
          </Card>
          <Card className="text-center">
            <UserCheck className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.gerentes}
            </div>
            <div className="text-sm text-gray-500">Gerentes</div>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todas as roles</option>
              {Object.entries(roleConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Pedidos de Acesso (quando um projeto ou workspace está selecionado e você tem permissão) */}
        {solicitacoes.some(s => s.status === 'pendente') && (
          <Card>
            <h3 className="font-semibold mb-3">
              Pedidos de Acesso {projetoAtual ? `para ${projetoAtual.nome}` : 'do Workspace'}
            </h3>
            <div className="space-y-2">
              {solicitacoes.filter(s => s.status === 'pendente').map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-light-card dark:bg-dark-card rounded border-light-border">
                  <div>
                    <div className="font-medium">{s.usuario.nome} <span className="text-xs text-light-muted">({s.usuario.email})</span></div>
                    {!projetoAtual && s.projeto && (
                      <div className="text-sm text-light-muted">Projeto: {s.projeto.nome}</div>
                    )}
                    {s.mensagem && <div className="text-sm text-light-muted">{s.mensagem}</div>}
                  </div>
                  {podeGerenciarSolicitacoes && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                        try {
                          const projetoId = projetoAtual?.id || s.projeto?.id
                          if (!projetoId) throw new Error('Projeto não encontrado')
                          await projetoServico.atualizarSolicitacao(projetoId, s.id, 'aprovado')
                          toast.success('Solicitação aprovada')
                          
                          // Reload solicitations
                          const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
                          const dados = projetoAtual 
                            ? await projetoServico.listarSolicitacoes(projetoAtual.id)
                            : workspaceId 
                              ? await projetoServico.listarSolicitacoesPorWorkspace(workspaceId)
                              : []
                          setSolicitacoes(dados || [])
                          await carregarUsuarios()
                        } catch (err) {
                          console.error('Erro ao aprovar solicitacao', err)
                          toast.error('Erro ao aprovar solicitação')
                        }
                      }}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                      >Aceitar</button>

                      <button
                        onClick={async () => {
                          try {
                            const projetoId = projetoAtual?.id || s.projeto?.id
                            if (!projetoId) throw new Error('Projeto não encontrado')
                            await projetoServico.atualizarSolicitacao(projetoId, s.id, 'rejeitado')
                            toast.success('Solicitação rejeitada')
                            
                            // Reload solicitations
                            const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
                            const dados = projetoAtual 
                              ? await projetoServico.listarSolicitacoes(projetoAtual.id)
                              : workspaceId 
                                ? await projetoServico.listarSolicitacoesPorWorkspace(workspaceId)
                                : []
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
          </Card>
        )}

        {/* Lista de Usuários */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500 mt-2">
              Tente ajustar os filtros de busca
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                      Usuário
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                      E-mail
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario, index) => (
                    <motion.tr
                      key={usuario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar nome={usuario.nome} size="sm" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {usuario.nome}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="w-4 h-4" />
                          <span>
                            {(!isAdmin && isManager && usuario.role === 'admin') ? (
                              <em className="text-sm text-gray-400">E-mail oculto</em>
                            ) : (
                              usuario.email
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={roleConfig[usuario.role].variant}>
                          {roleConfig[usuario.role].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {(isAdmin || (isManager && usuario.role !== 'admin')) ? (
                          <button
                            onClick={() => toggleAtivo(usuario)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              usuario.ativo
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {usuario.ativo ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                Inativo
                              </>
                            )}
                          </button>
                        ) : (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            usuario.ativo
                              ? 'bg-green-50 text-green-700 dark:bg-transparent dark:text-green-400'
                              : 'bg-transparent text-red-700 dark:text-red-400'
                          }`}>
                            {usuario.ativo ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                Inativo
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {(isAdmin || (isManager && usuario.role !== 'admin')) && (
                            <>
                              <button
                                onClick={() => abrirModal(usuario)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => excluirUsuario(usuario.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Modal de Criar/Editar */}
        <Modal
          isOpen={modalOpen}
          onClose={fecharModal}
          title={editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome"
              {...register('nome')}
              error={errors.nome?.message}
              placeholder="Nome completo"
            />
            
            <Input
              label="E-mail"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="email@exemplo.com"
            />

            <Input
              label={editingUsuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              type="password"
              {...register('senha')}
              error={errors.senha?.message}
              placeholder="••••••••"
            />

            {/**
             * Only admins can assign the `admin` role. For non-admins we remove
             * the admin option and if the target user is an admin we disable
             * changing the role entirely to avoid accidental demotion.
             */}
            <Select
              label="Role"
              {...register('role')}
              options={Object.entries(roleConfig)
                .filter(([value]) => isAdmin || value !== 'admin')
                .map(([value, config]) => ({ value, label: config.label }))}
              disabled={!isAdmin && editingUsuario?.role === 'admin'}
            />
            {!isAdmin && editingUsuario?.role === 'admin' && (
              <p className="text-xs text-gray-500 mt-1">Somente administradores podem alterar a função de um administrador.</p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                {...register('ativo')}
                className="w-4 h-4 rounded border-gray-300 text-align-500 focus:ring-align-500"
              />
              <label htmlFor="ativo" className="text-sm text-gray-700 dark:text-gray-300">
                Usuário ativo
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUsuario ? 'Salvar' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Modal>
        {/* Modal de Convite */}
        <Modal
          isOpen={inviteModalOpen}
          onClose={fecharInviteModal}
          title="Convite para Workspace"
          size="sm"
        >
          {inviteLink ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Copie e envie este link para quem você deseja convidar. O link expira em alguns minutos.</p>
              <input readOnly value={inviteLink} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded" />
              <div className="flex justify-end gap-2">
                <Button variante="secondary" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Link copiado'); }}>Copiar</Button>
                <Button onClick={fecharInviteModal}>Fechar</Button>
              </div>
            </div>
          ) : (
            <div>Gerando convite...</div>
          )}
        </Modal>
      </div>
    </MainLayout>
  )
}
