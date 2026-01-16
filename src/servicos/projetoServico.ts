import apiClient from './api';
import { 
  Projeto, 
  CriarProjetoDTO, 
  ApiResponse, 
  PaginatedResponse 
} from '@/tipos';

// Serviço de Projetos
export const projetoServico = {
  // Listar todos os projetos
  async listar(pagina = 1, porPagina = 20): Promise<PaginatedResponse<Projeto>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Projeto>>>('/projetos', {
      params: { pagina, porPagina },
    });
    console.log('[projetoServico.listar] response:', response.data);
    if (response.data.sucesso) {
      return {
        dados: response.data.dados || [],
        meta: response.data.meta || { total: 0, pagina: 1, porPagina: 20, totalPaginas: 1 }
      } as PaginatedResponse<Projeto>;
    }

    throw new Error(response.data.mensagem || 'Erro ao listar projetos');
  },
  
  // Listar projetos de um workspace
  async listarPorWorkspace(workspaceId: string, pagina = 1, porPagina = 20): Promise<PaginatedResponse<Projeto>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Projeto>>>(`/workspaces/${workspaceId}/projetos`, {
      params: { pagina, porPagina },
    });
    if (response.data.sucesso) {
      return {
        dados: response.data.dados || [],
        meta: response.data.meta || { total: 0, pagina, porPagina, totalPaginas: 0 }
      } as PaginatedResponse<Projeto>;
    }
    throw new Error(response.data.mensagem || 'Erro ao listar projetos do workspace');
  },
  
  // Buscar projeto por ID
  async buscarPorId(id: string): Promise<Projeto> {
    const response = await apiClient.get<ApiResponse<Projeto>>(`/projetos/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Projeto não encontrado');
  },
  
  // Criar novo projeto
  async criar(dados: CriarProjetoDTO | FormData): Promise<Projeto> {
    let response;

    if (dados instanceof FormData) {
      response = await apiClient.post<ApiResponse<Projeto>>('/projetos', dados, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      response = await apiClient.post<ApiResponse<Projeto>>('/projetos', dados);
    }

    console.log('[projetoServico.criar] response:', response.data);
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }

    throw new Error(response.data.mensagem || 'Erro ao criar projeto');
  },
  
  // Atualizar projeto
  async atualizar(id: string, dados: Partial<CriarProjetoDTO>): Promise<Projeto> {
    let response;

    if (dados instanceof FormData) {
      response = await apiClient.patch<ApiResponse<Projeto>>(`/projetos/${id}`, dados, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      response = await apiClient.patch<ApiResponse<Projeto>>(`/projetos/${id}`, dados);
    }

    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }

    throw new Error(response.data.mensagem || 'Erro ao atualizar projeto');
  },
  
  // Excluir projeto
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/projetos/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir projeto');
    }
  },
  
  // Adicionar membro ao projeto
  async adicionarMembro(projetoId: string, usuarioId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      `/projetos/${projetoId}/membros`,
      { usuarioId }
    );
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao adicionar membro');
    }
  },

  // Solicitar ingresso no projeto (cria uma solicitacao)
  async solicitarIngresso(projetoId: string, mensagem?: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/projetos/${projetoId}/solicitacoes`, { mensagem });
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao solicitar ingresso');
    }
  },

  // Solicitar ingresso por código/nome (public endpoint)
  async solicitarIngressoPorCodigo(codigoOrNome: string, mensagem?: string): Promise<void> {
    const payload: any = {};
    // try to detect uuid-ish id
    payload.codigo = codigoOrNome;
    if (mensagem) payload.mensagem = mensagem;

    const response = await apiClient.post<ApiResponse<void>>(`/projetos/solicitacoes`, payload);
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao solicitar ingresso');
    }
  },

  // Listar minhas solicitações pendentes
  async minhasSolicitacoes(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any>>('/solicitacoes/minhas');
    if (response.data.sucesso) {
      return response.data.dados || [];
    }
    return [];
  },
  
  // Remover membro do projeto
  async removerMembro(projetoId: string, usuarioId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/projetos/${projetoId}/membros/${usuarioId}`
    );
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao remover membro');
    }
  },
  
  // Buscar estatísticas do projeto
  async estatisticas(id: string): Promise<{
    tarefasTotal: number;
    tarefasConcluidas: number;
    tarefasEmProgresso: number;
    membrosAtivos: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      tarefasTotal: number;
      tarefasConcluidas: number;
      tarefasEmProgresso: number;
      membrosAtivos: number;
    }>>(`/projetos/${id}/estatisticas`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao buscar estatísticas');
  },
  // Reordenar projetos (persistir nova ordem)
  async reordenar(ids: string[]): Promise<void> {
    const response = await apiClient.post('/projetos/reordenar', { ids });
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao reordenar projetos');
    }
  },
  
  // Listar solicitações de ingresso para um projeto (somente para proprietários)
  async listarSolicitacoes(projetoId: string, pagina = 1, porPagina = 50) {
    const response = await apiClient.get<ApiResponse<any>>(`/projetos/${projetoId}/solicitacoes`, {
      params: { pagina, porPagina }
    });
    if (response.data.sucesso) {
      return response.data.dados || [];
    }
    throw new Error(response.data.mensagem || 'Erro ao listar solicitações');
  },

  // Listar solicitações de ingresso para todos os projetos de um workspace
  async listarSolicitacoesPorWorkspace(workspaceId: string, pagina = 1, porPagina = 50) {
    const response = await apiClient.get<ApiResponse<any>>(`/workspaces/${workspaceId}/solicitacoes`, {
      params: { pagina, porPagina }
    });
    if (response.data.sucesso) {
      return response.data.dados || [];
    }
    throw new Error(response.data.mensagem || 'Erro ao listar solicitações do workspace');
  },

  // Atualizar status de uma solicitação (aprovado/rejeitado)
  async atualizarSolicitacao(projetoId: string, solicitacaoId: string, status: 'aprovado' | 'rejeitado') {
    const response = await apiClient.patch<ApiResponse<any>>(`/projetos/${projetoId}/solicitacoes/${solicitacaoId}`, { status });
    if (response.data.sucesso) {
      return response.data.dados;
    }
    throw new Error(response.data.mensagem || 'Erro ao atualizar solicitação');
  },
};

export default projetoServico;
