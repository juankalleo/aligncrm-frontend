'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  ExternalLink,
  Link as LinkIcon,
  Edit,
  Trash2,
  Globe,
  FileText,
  Video,
  BookOpen,
  Wrench,
  FolderOpen,
  Copy,
  Check
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Link, CategoriaLink } from '@/tipos'
import { linkServico } from '@/servicos/arquivosServico'
import { projetoServico } from '@/servicos/projetoServico'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const linkSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  url: z.string().url('URL inválida'),
  descricao: z.string().optional(),
  categoria: z.enum(['github', 'frontend', 'backend', 'ambiente', 'documentacao', 'outro']),
  projetoId: z.string().optional(),
})

type LinkForm = z.infer<typeof linkSchema>

const categoriaConfig: Record<CategoriaLink, { label: string; icon: React.ElementType; color: string }> = {
  'github': { label: 'GitHub', icon: FileText, color: 'bg-gray-700' },
  'frontend': { label: 'Frontend', icon: BookOpen, color: 'bg-blue-500' },
  'backend': { label: 'Backend', icon: Video, color: 'bg-green-500' },
  'ambiente': { label: 'Ambiente', icon: Globe, color: 'bg-purple-500' },
  'documentacao': { label: 'Documentação', icon: Wrench, color: 'bg-yellow-500' },
  'outro': { label: 'Outro', icon: LinkIcon, color: 'bg-gray-500' },
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      categoria: 'outro',
    }
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      const [linksRes, projRes] = await Promise.all([
        workspaceId ? linkServico.listarPorWorkspace(workspaceId) : linkServico.listar(),
        workspaceId ? projetoServico.listarPorWorkspace(workspaceId) : projetoServico.listar()
      ])
      setLinks(linksRes)
      setProjetos((projRes as any).dados || (projRes as any) || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: LinkForm) => {
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      if (editingLink) {
        await linkServico.atualizar(editingLink.id, data)
      } else {
        await linkServico.criar(data, workspaceId || undefined)
      }
      carregarDados()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar link:', error)
    }
  }

  const excluirLink = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este link?')) {
      try {
        await linkServico.excluir(id)
        carregarDados()
      } catch (error) {
        console.error('Erro ao excluir link:', error)
      }
    }
  }

  const copiarUrl = (link: Link) => {
    navigator.clipboard.writeText(link.url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const abrirModal = (link?: Link) => {
    if (link) {
      setEditingLink(link)
      reset({
        nome: link.nome,
        url: link.url,
        descricao: link.descricao,
        categoria: link.categoria,
        projetoId: (link as any).projetoId || '',
      })
    } else {
      setEditingLink(null)
      reset({
        categoria: 'outro',
      })
    }
    setModalOpen(true)
  }

  const fecharModal = () => {
    setModalOpen(false)
    setEditingLink(null)
    reset()
  }

  const linksFiltrados = links.filter(link => {
    const matchSearch = link.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       link.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = categoriaFilter === 'todos' || link.categoria === categoriaFilter
    return matchSearch && matchCategoria
  })

  // Agrupar por categoria
  const categorias = Object.keys(categoriaConfig) as CategoriaLink[]
  const linksAgrupados = categorias.reduce((acc, categoria) => {
    acc[categoria] = linksFiltrados.filter(l => l.categoria === categoria)
    return acc
  }, {} as Record<CategoriaLink, Link[]>)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Links Úteis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Organize links e referências importantes
            </p>
          </div>
          <Button onClick={() => abrirModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Link
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todas as categorias</option>
              {Object.entries(categoriaConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Lista de Links */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : linksFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <LinkIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum link encontrado
            </h3>
            <p className="text-gray-500 mt-2">
              Adicione links úteis ao seu projeto
            </p>
            <Button onClick={() => abrirModal()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Link
            </Button>
          </Card>
        ) : categoriaFilter === 'todos' ? (
          // Visualização agrupada por categoria
          <div className="space-y-8">
            {Object.entries(linksAgrupados).map(([categoria, linksCategoria]) => {
              if (linksCategoria.length === 0) return null
              const config = categoriaConfig[categoria as CategoriaLink]
              const Icone = config.icon

              return (
                <div key={categoria}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icone className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {config.label}
                    </h2>
                    <span className="text-sm text-gray-500">({linksCategoria.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {linksCategoria.map((link, index) => (
                      <LinkCard 
                        key={link.id}
                        link={link}
                        index={index}
                        onEdit={() => abrirModal(link)}
                        onDelete={() => excluirLink(link.id)}
                        onCopy={() => copiarUrl(link)}
                        isCopied={copiedId === link.id}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Visualização sem agrupamento
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linksFiltrados.map((link, index) => (
              <LinkCard 
                key={link.id}
                link={link}
                index={index}
                onEdit={() => abrirModal(link)}
                onDelete={() => excluirLink(link.id)}
                onCopy={() => copiarUrl(link)}
                isCopied={copiedId === link.id}
              />
            ))}
          </div>
        )}

        {/* Modal de Criar/Editar */}
        <Modal
          isOpen={modalOpen}
          onClose={fecharModal}
          titulo={editingLink ? 'Editar Link' : 'Novo Link'}
          tamanho="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome"
              {...register('nome')}
              erro={errors.nome?.message as any}
              placeholder="Ex: Documentação da API"
            />
            
            <Input
              label="URL"
              {...register('url')}
              error={errors.url?.message}
              placeholder="https://..."
            />

            <Textarea
              label="Descrição"
              {...register('descricao')}
              placeholder="Descrição breve..."
              rows={2}
            />

            <Select
              label="Categoria"
              {...register('categoria')}
              options={Object.entries(categoriaConfig).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
            />

            <Select
              label="Projeto (opcional)"
              {...register('projetoId')}
              options={[
                { value: '', label: 'Sem projeto' },
                ...projetos.map(p => ({ value: p.id, label: p.nome }))
              ]}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variante="ghost" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingLink ? 'Salvar' : 'Adicionar Link'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}

// Componente de Card do Link
function LinkCard({ 
  link, 
  index, 
  onEdit, 
  onDelete, 
  onCopy, 
  isCopied 
}: {
  link: Link
  index: number
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  isCopied: boolean
}) {
  const config = categoriaConfig[link.categoria]
  const Icone = config.icon

  const getDominio = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="group hover:shadow-lg transition-shadow h-full">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
            <Icone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {link.titulo}
            </h3>
            <p className="text-sm text-gray-500 truncate">{getDominio(link.url)}</p>
          </div>
        </div>

        {link.descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
            {link.descricao}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-align-500 hover:text-align-600 flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir
          </a>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onCopy}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Copiar URL"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Editar"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
