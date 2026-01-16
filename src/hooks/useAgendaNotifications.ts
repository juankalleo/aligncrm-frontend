'use client';

import { useEffect } from 'react';
import { useNotificacoes } from '@/contextos';
import tarefaServico from '@/servicos/tarefaServico';

/**
 * Hook to check for tasks with deadline approaching (1 day before)
 * Runs once when component mounts and sets up daily check
 */
export function useAgendaNotifications() {
  const { adicionarNotificacao } = useNotificacoes();

  useEffect(() => {
    const checkAgenda = async () => {
      try {
        const projetoId = typeof window !== 'undefined' ? localStorage.getItem('projetoId') : null;
        const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;

        let tarefas: any[] = [];
        
        if (projetoId) {
          const res = await tarefaServico.listarPorProjeto(projetoId, 1, 1000, false);
          tarefas = res.dados || [];
        } else if (workspaceId) {
          const res = await tarefaServico.listarPorWorkspace(workspaceId, 1, 1000, false);
          tarefas = res.dados || [];
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Find tasks with deadline tomorrow
        const tarefasAmanha = tarefas.filter(t => {
          if (!t.prazo || t.status === 'concluida' || t.status === 'cancelada') return false;
          const prazo = new Date(t.prazo);
          return prazo >= tomorrow && prazo < dayAfterTomorrow;
        });

        // Create notifications for tasks due tomorrow
        tarefasAmanha.forEach(tarefa => {
          adicionarNotificacao({
            tipo: 'agenda',
            titulo: 'Prazo se aproximando',
            descricao: `A tarefa "${tarefa.titulo}" vence amanhã`,
            link: '/tarefas',
          });
        });
      } catch (err) {
        console.error('Erro ao verificar agenda:', err);
      }
    };

    // Check on mount
    checkAgenda();

    // Set up daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      checkAgenda();
      // Then check every 24 hours
      const intervalId = setInterval(checkAgenda, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, [adicionarNotificacao]);
}
