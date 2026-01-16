'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import ExcalidrawClient from '@/components/excalidraw/ExcalidrawClient'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Save,
  Trash2,
  FolderOpen,
  ChevronLeft
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { Fluxograma } from '@/tipos'
import { fluxogramaServico } from '@/servicos/fluxogramaServico'
import { projetoServico } from '@/servicos/projetoServico'
import useProjetoStore from '@/contextos/ProjetoStore'

// Import Excalidraw dinamicamente (não funciona com SSR)
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
      </div>
    )
  }
)

export default function FluxogramasPage() {
  const [fluxogramas, setFluxogramas] = useState<Fluxograma[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFluxograma, setSelectedFluxograma] = useState<Fluxograma | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [excalidrawData, setExcalidrawData] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const excalidrawRef = useRef<any>(null)
  
  console.log('FluxogramasPage renderizando...', { fluxogramas, projetos, loading })

  // Inject Excalidraw stylesheet at runtime to avoid build-time module resolution issues
  useEffect(() => {
    const href = 'https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw.min.css'
    if (typeof document === 'undefined') return;
    const existing = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null;
    let created: HTMLLinkElement | null = null;
    if (!existing) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      created = link
    }

    return () => {
      try {
        if (created && created.parentNode) created.parentNode.removeChild(created);
      } catch (err) {
        // ignore
      }
    }
  }, [])
  
  // Formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    projeto_id: '',
  })

  const projetoAtual = useProjetoStore(state => state.projetoAtual)

  useEffect(() => {
    carregarDados()
  }, [projetoAtual])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null
      let fluxRes
      if (projetoAtual && projetoAtual.id) {
        fluxRes = await fluxogramaServico.listarPorProjeto(projetoAtual.id)
      } else if (workspaceId) {
        fluxRes = await fluxogramaServico.listarPorWorkspace(workspaceId)
      } else {
        // No workspace or project selected - show empty
        fluxRes = []
      }

      const projRes = workspaceId ? await projetoServico.listarPorWorkspace(workspaceId) : await projetoServico.listar()

      setFluxogramas(fluxRes)
      setProjetos(projRes.dados || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setFluxogramas([])
      setProjetos([])
    } finally {
      setLoading(false)
    }
  }

  const abrirFluxograma = (fluxograma: Fluxograma) => {
    setSelectedFluxograma(fluxograma)
    const dados = fluxograma.dados
    let initialData = { elements: [], appState: {} }
    try {
      if (typeof dados === 'string' && dados.trim() !== '') {
        initialData = JSON.parse(dados)
      } else if (dados && typeof dados === 'object') {
        initialData = dados
      }
    } catch (err) {
      console.error('Erro ao parsear dados do fluxograma:', err)
    }
    console.log('Fluxograma initialData:', initialData)
    setExcalidrawData(initialData)
    setEditMode(true)
  }

  const novoFluxograma = () => {
    setSelectedFluxograma(null)
    setExcalidrawData({ elements: [], appState: {} })
    setFormData({ nome: '', descricao: '', projeto_id: '' })
    setModalOpen(true)
  }

  const salvarFluxograma = async () => {
    if (!formData.nome.trim()) {
      alert('Informe um nome para o fluxograma')
      return
    }

    try {
      const currentData = excalidrawRef.current?.getData?.() || excalidrawData || { elements: [], appState: {} }
      const dados = {
        ...formData,
        dados: currentData,
      }
      console.log('salvarFluxograma payload:', dados)

      if (selectedFluxograma) {
        await fluxogramaServico.atualizar(selectedFluxograma.id, dados)
      } else {
        await fluxogramaServico.criar(dados)
      }
      
      carregarDados()
      voltarParaLista()
    } catch (error) {
      console.error('Erro ao salvar fluxograma:', error)
    }
  }

  const excluirFluxograma = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fluxograma?')) {
      try {
        await fluxogramaServico.excluir(id)
        carregarDados()
        if (selectedFluxograma?.id === id) {
          voltarParaLista()
        }
      } catch (error) {
        console.error('Erro ao excluir fluxograma:', error)
      }
    }
  }

  const voltarParaLista = () => {
    setEditMode(false)
    setSelectedFluxograma(null)
    setExcalidrawData(null)
    setModalOpen(false)
  }

  const handleExcalidrawChange = useCallback((elements: any[], appState: any) => {
    // do not update parent state on every editor change (prevents update loops)
  }, [])

  const criarEAbrirEditor = () => {
    setModalOpen(false)
    setEditMode(true)
  }

  // Editor Mode
  if (editMode) {
    return (
      <MainLayout>
        <div className="h-full flex flex-col -m-6">
          {/* Header do Editor */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <button
                onClick={voltarParaLista}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <input
                  type="text"
                  value={formData.nome || selectedFluxograma?.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do fluxograma"
                  className="font-semibold text-lg bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={voltarParaLista}>
                Cancelar
              </Button>
              <Button onClick={salvarFluxograma}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Excalidraw Canvas */}
          <div className="flex-1 bg-white flex flex-col" style={{ minHeight: 400 }}>
            <div className="flex-1 w-full">
              <ExcalidrawClient
                key={selectedFluxograma ? selectedFluxograma.id : 'new'}
                ref={excalidrawRef}
                initialData={excalidrawData}
                onChange={(elements: any[], appState: any) => handleExcalidrawChange(elements, appState)}
              />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Lista de Fluxogramas
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fluxogramas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Crie e edite fluxogramas com Excalidraw
            </p>
          </div>
          <Button onClick={novoFluxograma}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fluxograma
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : fluxogramas.length === 0 ? (
          <Card className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum fluxograma ainda
            </h3>
            <p className="text-gray-500 mt-2">
              Crie seu primeiro fluxograma
            </p>
            <Button onClick={novoFluxograma} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Criar Fluxograma
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fluxogramas.map((fluxograma, index) => (
              <motion.div
                key={fluxograma.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => abrirFluxograma(fluxograma)}
                >
                  {/* Preview placeholder */}
                  <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-4xl text-gray-300 dark:text-gray-600">
                      📊
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {fluxograma.nome}
                      </h3>
                      {fluxograma.descricao && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {fluxograma.descricao}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Atualizado em {new Date(fluxograma.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        excluirFluxograma(fluxograma.id)
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal Novo Fluxograma */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Novo Fluxograma"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Fluxo de aprovação"
            />
            
            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o fluxograma..."
              rows={3}
            />

            <Select
              label="Projeto (opcional)"
              value={formData.projeto_id}
              onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
              options={[
                { value: '', label: 'Sem projeto' },
                ...(projetos || []).map(p => ({ value: p.id, label: p.nome }))
              ]}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={criarEAbrirEditor}>
                Criar e Editar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
