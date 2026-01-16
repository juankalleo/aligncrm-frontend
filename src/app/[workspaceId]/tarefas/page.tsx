"use client"

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import useProjetoStore from '@/contextos/ProjetoStore'
import TarefasPage from '../../tarefas/page'

export default function WorkspaceTarefasRoute() {
  const params = useParams() as { workspaceId?: string }
  const workspaceId = params?.workspaceId
  const carregarTarefasPorWorkspace = useProjetoStore(state => state.carregarTarefasPorWorkspace)
  const resetar = useProjetoStore(state => state.resetar)

  useEffect(() => {
    if (!workspaceId) return
    (async () => {
      try {
        try { localStorage.setItem('workspaceId', workspaceId) } catch (e) {}
        await resetar()
        await carregarTarefasPorWorkspace(workspaceId)
      } catch (err) {
        console.error('Erro ao selecionar workspace via rota:', err)
      }
    })()
  }, [workspaceId, carregarTarefasPorWorkspace, resetar])

  return <TarefasPage />
}
