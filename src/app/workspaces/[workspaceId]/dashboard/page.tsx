"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { tarefaServico, workspaceServico } from '@/servicos'
// Simple list rendering to avoid coupling with project-specific components

export default function WorkspaceDashboard() {
  const params = useParams() as { workspaceId?: string }
  const workspaceId = params?.workspaceId
  const [tarefas, setTarefas] = useState([])
  const [workspace, setWorkspace] = useState<any | null>(null)

  useEffect(() => {
    if (!workspaceId) return
    (async () => {
      try {
        const w = await workspaceServico.buscarPorId(workspaceId)
        setWorkspace(w)
        const t = await tarefaServico.listarPorWorkspace(workspaceId, 1, 10)
        setTarefas(t.dados || [])
      } catch (err) {
        console.error('Erro ao carregar dashboard do workspace', err)
      }
    })()
  }, [workspaceId])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{workspace?.nome || 'Workspace'}</h1>
      <section>
        <h2 className="font-medium mb-2">Tarefas recentes</h2>
        {/* Reuse existing tarefas list component if available */}
        {/* If not, render simple list */}
        {tarefas.length > 0 ? (
          <ul className="space-y-2">
            {tarefas.map((t: any) => (
              <li key={t.id} className="p-3 bg-light-card dark:bg-dark-card rounded">
                <div className="font-medium">{t.titulo}</div>
                <div className="text-sm text-light-muted">{t.status}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-light-muted">Nenhuma tarefa encontrada no workspace.</p>
        )}
      </section>
    </div>
  )
}
