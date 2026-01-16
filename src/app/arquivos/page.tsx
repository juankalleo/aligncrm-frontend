'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Upload,
  Download,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  Eye
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Badge } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Form'
import { Arquivo, Workspace } from '@/tipos'
import { arquivoServico } from '@/servicos/arquivosServico'
import { projetoServico } from '@/servicos/projetoServico'
import { workspaceServico } from '@/servicos/workspaceServico'
import StorageIndicator from '@/components/workspace/StorageIndicator'

const tipoIcones: Record<string, React.ElementType> = {
  'image': FileImage,
  'video': FileVideo,
  'audio': FileAudio,
  'application/pdf': FileText,
  'application/zip': FileArchive,
  'application/x-rar': FileArchive,
  'default': File,
}

const formatarTamanho = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getIcone = (mimeType: string): React.ElementType => {
  if (mimeType.startsWith('image')) return FileImage
  if (mimeType.startsWith('video')) return FileVideo
  if (mimeType.startsWith('audio')) return FileAudio
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive
  return File
}

export default function ArquivosPage() {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [projetoFilter, setProjetoFilter] = useState<string>('todos')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    projeto_id: '',
  })
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      const [arqRes, projRes, wsRes] = await Promise.all([
        workspaceId ? arquivoServico.listarPorWorkspace(workspaceId) : arquivoServico.listar(),
        workspaceId ? projetoServico.listarPorWorkspace(workspaceId) : projetoServico.listar(),
        workspaceId ? workspaceServico.buscarPorId(workspaceId) : Promise.resolve(null)
      ])
      setArquivos(arqRes)
      setProjetos((projRes as any).dados || (projRes as any) || [])
      setWorkspace(wsRes)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Selecione ao menos um arquivo')
      return
    }

    // Validar espaço disponível
    if (workspace) {
      const totalSize = Array.from(selectedFiles).reduce((acc, file) => acc + file.size, 0)
      if (totalSize > workspace.storageDisponivel) {
        const disponivel = (workspace.storageDisponivel / (1024 * 1024)).toFixed(2)
        const necessario = (totalSize / (1024 * 1024)).toFixed(2)
        alert(`Espaço insuficiente! Disponível: ${disponivel}MB, Necessário: ${necessario}MB`)
        return
      }
    }

    setUploading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      const projetoId = formData.projeto_id || undefined
      
      for (const file of Array.from(selectedFiles)) {
        await arquivoServico.upload(file, projetoId, workspaceId || undefined)
      }
      carregarDados()
      fecharModal()
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(error?.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const excluirArquivo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      try {
        await arquivoServico.excluir(id)
        carregarDados()
      } catch (error) {
        console.error('Erro ao excluir arquivo:', error)
      }
    }
  }

  const baixarArquivo = async (arquivo: Arquivo) => {
    try {
      const blob = await arquivoServico.download(arquivo.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = arquivo.nome
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
    }
  }

  const abrirModal = () => {
    setFormData({ projeto_id: '' })
    setSelectedFiles(null)
    setModalOpen(true)
  }

  const fecharModal = () => {
    setModalOpen(false)
    setSelectedFiles(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFiles(files)
      setModalOpen(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const arquivosFiltrados = arquivos.filter(arquivo => {
    const matchSearch = arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchProjeto = projetoFilter === 'todos' || arquivo.projeto_id === projetoFilter
    return matchSearch && matchProjeto
  })

  const estatisticas = {
    total: arquivos.length,
    tamanhoTotal: arquivos.reduce((acc, a) => acc + a.tamanho, 0),
    imagens: arquivos.filter(a => a.tipo?.startsWith('image')).length,
    documentos: arquivos.filter(a => a.tipo?.includes('pdf') || a.tipo?.includes('document')).length,
  }

  return (
    <MainLayout>
      <div 
        className="space-y-6"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Arquivos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie arquivos dos projetos
            </p>
          </div>
          <Button onClick={abrirModal}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Indicador de Armazenamento */}
        {workspace && (
          <StorageIndicator workspace={workspace} />
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <File className="w-8 h-8 mx-auto text-align-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.total}
            </div>
            <div className="text-sm text-gray-500">Arquivos</div>
          </Card>
          <Card className="text-center">
            <FileArchive className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarTamanho(estatisticas.tamanhoTotal)}
            </div>
            <div className="text-sm text-gray-500">Tamanho Total</div>
          </Card>
          <Card className="text-center">
            <FileImage className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.imagens}
            </div>
            <div className="text-sm text-gray-500">Imagens</div>
          </Card>
          <Card className="text-center">
            <FileText className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.documentos}
            </div>
            <div className="text-sm text-gray-500">Documentos</div>
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
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={projetoFilter}
              onChange={(e) => setProjetoFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-align-500"
            >
              <option value="todos">Todos os projetos</option>
              {projetos.map(projeto => (
                <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Drop Zone / Lista */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : arquivosFiltrados.length === 0 ? (
          <Card 
            className="text-center py-12 border-2 border-dashed cursor-pointer hover:border-align-500 transition-colors"
            onClick={abrirModal}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum arquivo
            </h3>
            <p className="text-gray-500 mt-2">
              Arraste e solte arquivos aqui ou clique para fazer upload
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {arquivosFiltrados.map((arquivo, index) => {
              const Icone = getIcone(arquivo.tipo || '')
              
              return (
                <motion.div
                  key={arquivo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="group hover:shadow-lg transition-shadow">
                    {/* Preview */}
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      {arquivo.tipo?.startsWith('image') && arquivo.url ? (
                        <img 
                          src={arquivo.url} 
                          alt={arquivo.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icone className="w-12 h-12 text-gray-400" />
                      )}
                      
                      {/* Overlay de ações */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => baixarArquivo(arquivo)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => excluirArquivo(arquivo.id)}
                          className="p-2 bg-white rounded-lg hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate" title={arquivo.nome}>
                        {arquivo.nome}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span>{formatarTamanho(arquivo.tamanho)}</span>
                        <span>{new Date(arquivo.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Modal de Upload */}
        <Modal
          isOpen={modalOpen}
          onClose={fecharModal}
          title="Upload de Arquivos"
          size="md"
        >
          <div className="space-y-4">
            {/* Drop Zone */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-align-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Clique para selecionar ou arraste arquivos aqui
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Arquivos Selecionados */}
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Arquivos selecionados:
                </h4>
                {Array.from(selectedFiles).map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <File className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatarTamanho(file.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <Select
              label="Projeto (opcional)"
              value={formData.projeto_id}
              onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
              options={[
                { value: '', label: 'Sem projeto' },
                ...projetos.map(p => ({ value: p.id, label: p.nome }))
              ]}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFiles}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
