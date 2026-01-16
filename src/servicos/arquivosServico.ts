import apiClient from './api';
import { 
  Arquivo, 
  Link, 
  CriarLinkDTO,
  ApiResponse, 
  PaginatedResponse 
} from '@/tipos';

// Serviço de Arquivos
export const arquivoServico = {
  // Listar arquivos
  async listar(projetoId?: string): Promise<Arquivo[]> {
    const response = await apiClient.get<ApiResponse<Arquivo[]>>('/arquivos', {
      params: { projetoId },
    });
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar arquivos');
  },

  // Listar arquivos por workspace
  async listarPorWorkspace(workspaceId: string): Promise<Arquivo[]> {
    const response = await apiClient.get<ApiResponse<Arquivo[]>>(`/workspaces/${workspaceId}/arquivos`);
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    throw new Error(response.data.mensagem || 'Erro ao listar arquivos do workspace');
  },
  
  // Upload de arquivo
  async upload(arquivo: File, projetoId?: string, workspaceId?: string): Promise<Arquivo> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    if (projetoId) {
      formData.append('projetoId', projetoId);
    }
    
    // Use workspace endpoint if workspaceId provided and no projetoId
    const endpoint = !projetoId && workspaceId 
      ? `/workspaces/${workspaceId}/arquivos`
      : '/arquivos';
    
    const response = await apiClient.post<ApiResponse<Arquivo>>(
      endpoint,
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
    
    throw new Error(response.data.mensagem || 'Erro ao fazer upload');
  },
  
  // Excluir arquivo
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/arquivos/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir arquivo');
    }
  },
  
  // Download de arquivo
  async download(id: string): Promise<Blob> {
    const response = await apiClient.get(`/arquivos/${id}/download`, {
      responseType: 'blob',
    });
    
    return response.data;
  },
};

// Serviço de Links
export const linkServico = {
  // Listar links
  async listar(projetoId?: string): Promise<Link[]> {
    const response = await apiClient.get<ApiResponse<Link[]>>('/links', {
      params: { projetoId },
    });
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar links');
  },

  // Listar links por workspace
  async listarPorWorkspace(workspaceId: string): Promise<Link[]> {
    const response = await apiClient.get<ApiResponse<Link[]>>(`/workspaces/${workspaceId}/links`);
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    throw new Error(response.data.mensagem || 'Erro ao listar links do workspace');
  },
  
  // Criar link
  async criar(dados: CriarLinkDTO, workspaceId?: string): Promise<Link> {
    // Use workspace endpoint if workspaceId provided and no projetoId
    const endpoint = !dados.projetoId && workspaceId
      ? `/workspaces/${workspaceId}/links`
      : '/links';
    
    const response = await apiClient.post<ApiResponse<Link>>(endpoint, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao criar link');
  },
  
  // Atualizar link
  async atualizar(id: string, dados: Partial<CriarLinkDTO>): Promise<Link> {
    const response = await apiClient.patch<ApiResponse<Link>>(`/links/${id}`, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao atualizar link');
  },
  
  // Excluir link
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/links/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir link');
    }
  },
};
