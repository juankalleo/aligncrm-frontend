'use client';

import { create } from 'zustand';
import { Projeto, Tarefa, StatusTarefa } from '@/tipos';
import { projetoServico, tarefaServico } from '@/servicos';

interface ProjetoState {
  projetos: Projeto[];
  projetoAtual: Projeto | null;
  tarefas: Tarefa[];
  isLoading: boolean;
  erro: string | null;
  
  // Ações de Projetos
  carregarProjetos: () => Promise<void>;
  selecionarProjeto: (id: string) => Promise<void>;
  criarProjeto: (dados: Parameters<typeof projetoServico.criar>[0]) => Promise<Projeto>;
  atualizarProjeto: (id: string, dados: Parameters<typeof projetoServico.atualizar>[1]) => Promise<void>;
  excluirProjeto: (id: string) => Promise<void>;
  
  // Ações de Tarefas
  carregarTarefas: (projetoId: string) => Promise<void>;
  carregarTarefasPorWorkspace: (workspaceId: string) => Promise<void>;
  criarTarefa: (dados: Parameters<typeof tarefaServico.criar>[0]) => Promise<Tarefa>;
  atualizarTarefa: (id: string, dados: Parameters<typeof tarefaServico.atualizar>[1]) => Promise<void>;
  excluirTarefa: (id: string) => Promise<void>;
  moverTarefa: (tarefaId: string, novoStatus: StatusTarefa, novaOrdem: number) => Promise<void>;
  
  // Utilitários
  limparErro: () => void;
  resetar: () => void;
}

export const useProjetoStore = create<ProjetoState>((set, get) => ({
  projetos: [],
  projetoAtual: null,
  tarefas: [],
  isLoading: false,
  erro: null,

  // Carregar todos os projetos
  carregarProjetos: async () => {
    set({ isLoading: true, erro: null });
    try {
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
      const response = workspaceId ? await projetoServico.listarPorWorkspace(workspaceId) : await projetoServico.listar();
      // normalize
      const dados = (response as any).dados || (response as any) || []
      set({ projetos: dados, isLoading: false });
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao carregar projetos',
        isLoading: false 
      });
    }
  },

  // Selecionar projeto e carregar suas tarefas
  selecionarProjeto: async (id: string) => {
    set({ isLoading: true, erro: null });
    try {
      const projeto = await projetoServico.buscarPorId(id);
      const tarefasResponse = await tarefaServico.listarPorProjeto(id);
      // Persist workspace selection when selecting a project
      try {
        if (projeto.workspace && projeto.workspace.id) {
          localStorage.setItem('workspaceId', projeto.workspace.id);
        }
      } catch (e) {
        // ignore
      }
      set({ 
        projetoAtual: projeto, 
        tarefas: tarefasResponse.dados,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao carregar projeto',
        isLoading: false 
      });
    }
  },

  // Criar novo projeto
  criarProjeto: async (dados) => {
    set({ isLoading: true, erro: null });
    try {
      const novoProjeto = await projetoServico.criar(dados);
      set(state => ({ 
        projetos: [...state.projetos, novoProjeto],
        isLoading: false 
      }));
      return novoProjeto;
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao criar projeto',
        isLoading: false 
      });
      throw error;
    }
  },

  // Atualizar projeto
  atualizarProjeto: async (id, dados) => {
    set({ isLoading: true, erro: null });
    try {
      const projetoAtualizado = await projetoServico.atualizar(id, dados);
      set(state => ({
        projetos: state.projetos.map(p => p.id === id ? projetoAtualizado : p),
        projetoAtual: state.projetoAtual?.id === id ? projetoAtualizado : state.projetoAtual,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao atualizar projeto',
        isLoading: false 
      });
      throw error;
    }
  },

  // Excluir projeto
  excluirProjeto: async (id) => {
    set({ isLoading: true, erro: null });
    try {
      await projetoServico.excluir(id);
      set(state => ({
        projetos: state.projetos.filter(p => p.id !== id),
        projetoAtual: state.projetoAtual?.id === id ? null : state.projetoAtual,
        tarefas: state.projetoAtual?.id === id ? [] : state.tarefas,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao excluir projeto',
        isLoading: false 
      });
      throw error;
    }
  },

  // Carregar tarefas de um projeto
  carregarTarefas: async (projetoId) => {
    set({ isLoading: true, erro: null });
    try {
      // If a workspace is selected and no project provided, list by workspace
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
      let response;
      if (!projetoId && workspaceId) {
        response = await tarefaServico.listarPorWorkspace(workspaceId);
      } else {
        response = await tarefaServico.listarPorProjeto(projetoId);
      }
      set({ tarefas: response.dados, isLoading: false });
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao carregar tarefas',
        isLoading: false 
      });
    }
  },

  // Carregar tarefas diretamente de um workspace
  carregarTarefasPorWorkspace: async (workspaceId) => {
    set({ isLoading: true, erro: null });
    try {
      const response = await tarefaServico.listarPorWorkspace(workspaceId);
      set({ tarefas: response.dados, isLoading: false });
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao carregar tarefas do workspace',
        isLoading: false 
      });
    }
  },

  // Criar nova tarefa
  criarTarefa: async (dados) => {
    set({ isLoading: true, erro: null });
    try {
      const novaTarefa = await tarefaServico.criar(dados);
      set(state => ({ 
        tarefas: [...state.tarefas, novaTarefa],
        isLoading: false 
      }));
      return novaTarefa;
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao criar tarefa',
        isLoading: false 
      });
      throw error;
    }
  },

  // Atualizar tarefa
  atualizarTarefa: async (id, dados) => {
    try {
      const tarefaAtualizada = await tarefaServico.atualizar(id, dados);
      set(state => ({
        tarefas: state.tarefas.map(t => t.id === id ? tarefaAtualizada : t)
      }));
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao atualizar tarefa'
      });
      throw error;
    }
  },

  // Excluir tarefa
  excluirTarefa: async (id) => {
    try {
      await tarefaServico.excluir(id);
      set(state => ({
        tarefas: state.tarefas.filter(t => t.id !== id)
      }));
    } catch (error) {
      set({ 
        erro: error instanceof Error ? error.message : 'Erro ao excluir tarefa'
      });
      throw error;
    }
  },

  // Mover tarefa (drag and drop)
  moverTarefa: async (tarefaId, novoStatus, novaOrdem) => {
    const { tarefas } = get();
    const tarefaOriginal = tarefas.find(t => t.id === tarefaId);
    
    if (!tarefaOriginal) return;

    // Atualização otimista
    set(state => ({
      tarefas: state.tarefas.map(t => 
        t.id === tarefaId 
          ? { ...t, status: novoStatus, ordem: novaOrdem }
          : t
      )
    }));

    try {
      await tarefaServico.reordenar({ tarefaId, novoStatus, novaOrdem });
    } catch (error) {
      // Reverter em caso de erro
      set(state => ({
        tarefas: state.tarefas.map(t => 
          t.id === tarefaId ? tarefaOriginal : t
        ),
        erro: error instanceof Error ? error.message : 'Erro ao mover tarefa'
      }));
    }
  },

  limparErro: () => set({ erro: null }),
  
  resetar: () => set({
    projetos: [],
    projetoAtual: null,
    tarefas: [],
    isLoading: false,
    erro: null
  }),
}));

export default useProjetoStore;
