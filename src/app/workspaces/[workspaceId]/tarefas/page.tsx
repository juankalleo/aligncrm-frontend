"use client"

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import useProjetoStore from '@/contextos/ProjetoStore'
import TarefasPage from '../../../tarefas/page'

export default function WorkspaceTarefasRoute() {
  const params = useParams() as { workspaceId?: string }
  const workspaceId = params?.workspaceId
  const carregarTarefasPorWorkspace = useProjetoStore(state => state.carregarTarefasPorWorkspace)

  useEffect(() => {
    if (!workspaceId) return
    (async () => {
      try {
        await carregarTarefasPorWorkspace(workspaceId)
      } catch (err) {
        console.error('Erro ao carregar tarefas do workspace via rota:', err)
      }
    })()
  }, [workspaceId, carregarTarefasPorWorkspace])

  return <TarefasPage />
}
