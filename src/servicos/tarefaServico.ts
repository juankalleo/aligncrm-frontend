import apiClient from './api';
import { 
  Tarefa, 
  CriarTarefaDTO, 
  AtualizarOrdemTarefaDTO,
  ApiResponse, 
  PaginatedResponse,
  StatusTarefa
} from '@/tipos';

// Serviço de Tarefas
export const tarefaServico = {
  // Listar tarefas de um projeto
  async listarPorProjeto(
    projetoId: string, 
    pagina = 1, 
    porPagina = 50,
    incluirArquivadas = false
  ): Promise<PaginatedResponse<Tarefa>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Tarefa>>>(
      `/projetos/${projetoId}/tarefas`,
      { params: { pagina, porPagina, incluir_arquivadas: incluirArquivadas } }
    );
    
    if (response.data.sucesso) {
      return {
        dados: response.data.dados || [],
        meta: response.data.meta || { total: 0, pagina: pagina, porPagina: porPagina, totalPaginas: 0 }
      };
    }

    throw new Error(response.data.mensagem || 'Erro ao listar tarefas');
  },
  
  // Listar tarefas de um workspace (inclui tarefas sem projeto)
  async listarPorWorkspace(
    workspaceId: string,
    pagina = 1,
    porPagina = 50,
    incluirArquivadas = false
  ): Promise<PaginatedResponse<Tarefa>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Tarefa>>>(
      `/workspaces/${workspaceId}/tarefas`,
      { params: { pagina, porPagina, incluir_arquivadas: incluirArquivadas } }
    );

    if (response.data.sucesso) {
      return {
        dados: response.data.dados || [],
        meta: response.data.meta || { total: 0, pagina: pagina, porPagina: porPagina, totalPaginas: 0 }
      };
    }

    throw new Error(response.data.mensagem || 'Erro ao listar tarefas do workspace');
  },
  
  // Listar todas as tarefas do usuário
  async listarMinhasTarefas(pagina = 1, porPagina = 50): Promise<PaginatedResponse<Tarefa>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Tarefa>>>(
      '/tarefas/minhas',
      { params: { pagina, porPagina } }
    );
    
    if (response.data.sucesso) {
      return {
        dados: response.data.dados || [],
        meta: response.data.meta || { total: 0, pagina: pagina, porPagina: porPagina, totalPaginas: 0 }
      };
    }

    throw new Error(response.data.mensagem || 'Erro ao listar tarefas');
  },
  
  // Buscar tarefa por ID
  async buscarPorId(id: string): Promise<Tarefa> {
    const response = await apiClient.get<ApiResponse<Tarefa>>(`/tarefas/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Tarefa não encontrada');
  },
  
  // Criar nova tarefa
  async criar(dados: CriarTarefaDTO): Promise<Tarefa> {
    const response = await apiClient.post<ApiResponse<Tarefa>>('/tarefas', dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao criar tarefa');
  },
  
  // Atualizar tarefa
  async atualizar(id: string, dados: Partial<CriarTarefaDTO>): Promise<Tarefa> {
    const response = await apiClient.patch<ApiResponse<Tarefa>>(`/tarefas/${id}`, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar tarefa');
  },
  
  // Excluir tarefa
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/tarefas/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir tarefa');
    }
  },
  
  // Atualizar status da tarefa
  async atualizarStatus(id: string, status: StatusTarefa): Promise<Tarefa> {
    const response = await apiClient.patch<ApiResponse<Tarefa>>(
      `/tarefas/${id}/status`,
      { status }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar status');
  },
  
  // Reordenar tarefa (drag and drop)
  async reordenar(dados: AtualizarOrdemTarefaDTO): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(
      `/tarefas/${dados.tarefaId}/reordenar`,
      {
        novoStatus: dados.novoStatus,
        novaOrdem: dados.novaOrdem,
      }
    );
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao reordenar tarefa');
    }
  },
  
  // Atribuir responsável
  async atribuirResponsavel(tarefaId: string, usuarioId: string | null): Promise<Tarefa> {
    const response = await apiClient.patch<ApiResponse<Tarefa>>(
      `/tarefas/${tarefaId}/atribuir`,
      { usuarioId }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atribuir responsável');
  },

  // Arquivar tarefas concluídas
  async arquivarConcluidas(projetoId?: string, workspaceId?: string): Promise<number> {
    let url = '';
    
    if (projetoId) {
      url = `/projetos/${projetoId}/tarefas/arquivar_concluidas`;
    } else if (workspaceId) {
      url = `/workspaces/${workspaceId}/tarefas/arquivar_concluidas`;
    } else {
      throw new Error('Projeto ou workspace não informado');
    }

    const response = await apiClient.post<ApiResponse<{ count: number }>>(url);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados.count;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao arquivar tarefas concluídas');
  },
};

export default tarefaServico;
