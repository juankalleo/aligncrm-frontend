"use client"

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import useProjetoStore from '@/contextos/ProjetoStore'
import AgendaPage from '../../agenda/page'

export default function WorkspaceAgendaRoute() {
  const params = useParams() as { workspaceId?: string }
  const workspaceId = params?.workspaceId
  const resetar = useProjetoStore(state => state.resetar)

  useEffect(() => {
    if (!workspaceId) return
    (async () => {
      try {
        try { localStorage.setItem('workspaceId', workspaceId) } catch (e) {}
        await resetar()
      } catch (err) {
        console.error('Erro ao selecionar workspace via rota:', err)
      }
    })()
  }, [workspaceId, resetar])

  return <AgendaPage />
}
