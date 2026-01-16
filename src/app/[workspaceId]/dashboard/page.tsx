"use client"

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import useProjetoStore from '@/contextos/ProjetoStore'
import DashboardPage from '../../dashboard/page'

export default function WorkspaceDashboardRoute() {
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

  return <DashboardPage />
}
