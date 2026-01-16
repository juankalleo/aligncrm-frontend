import apiClient from './api';
import { 
  Evento, 
  CriarEventoDTO, 
  ApiResponse, 
  PaginatedResponse 
} from '@/tipos';

// Serviço de Agenda/Eventos
export const agendaServico = {
  // Listar eventos
  async listar(
    dataInicio?: string, 
    dataFim?: string
  ): Promise<Evento[]> {
    const response = await apiClient.get<ApiResponse<Evento[]>>('/eventos', {
      params: { dataInicio, dataFim },
    });
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar eventos');
  },
  
  // Buscar evento por ID
  async buscarPorId(id: string): Promise<Evento> {
    const response = await apiClient.get<ApiResponse<Evento>>(`/eventos/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Evento não encontrado');
  },
  
  // Criar evento
  async criar(dados: CriarEventoDTO, workspaceId?: string): Promise<Evento> {
    // Use workspace endpoint if workspaceId provided and no projetoId
    const endpoint = !dados.projetoId && workspaceId
      ? `/workspaces/${workspaceId}/eventos`
      : '/eventos';
    
    const response = await apiClient.post<ApiResponse<Evento>>(endpoint, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao criar evento');
  },
  
  // Atualizar evento
  async atualizar(id: string, dados: Partial<CriarEventoDTO>): Promise<Evento> {
    const response = await apiClient.patch<ApiResponse<Evento>>(`/eventos/${id}`, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar evento');
  },
  
  // Excluir evento
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/eventos/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir evento');
    }
  },
  
  // Eventos de um projeto
  async porProjeto(projetoId: string): Promise<Evento[]> {
    const response = await apiClient.get<ApiResponse<Evento[]>>(
      `/projetos/${projetoId}/eventos`
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar eventos do projeto');
  },

  // Eventos de um workspace
  async porWorkspace(workspaceId: string): Promise<Evento[]> {
    const response = await apiClient.get<ApiResponse<Evento[]>>(
      `/workspaces/${workspaceId}/eventos`
    );

    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }

    throw new Error(response.data.mensagem || 'Erro ao listar eventos do workspace');
  },
  
  // Exportar para ICS (Google Calendar)
  async exportarICS(eventoIds?: string[]): Promise<Blob> {
    const response = await apiClient.post(
      '/eventos/exportar-ics',
      { eventoIds },
      { responseType: 'blob' }
    );
    
    return response.data;
  },
  
  // Importar eventos de arquivo ICS
  async importarICS(arquivo: File): Promise<Evento[]> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    
    const response = await apiClient.post<ApiResponse<Evento[]>>(
      '/eventos/importar-ics',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao importar eventos');
  },
};

export default agendaServico;
