import apiClient from './api';
import { 
  Fluxograma, 
  CriarFluxogramaDTO,
  ApiResponse 
} from '@/tipos';

// Serviço de Fluxogramas (Excalidraw)
export const fluxogramaServico = {
  // Listar todos os fluxogramas
  async listar(): Promise<Fluxograma[]> {
    const response = await apiClient.get<ApiResponse<Fluxograma[]>>('/fluxogramas');
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar fluxogramas');
  },

  // Listar fluxogramas de um projeto
  async listarPorProjeto(projetoId: string): Promise<Fluxograma[]> {
    const response = await apiClient.get<ApiResponse<Fluxograma[]>>(
      `/projetos/${projetoId}/fluxogramas`
    );
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar fluxogramas');
  },

  // Listar fluxogramas de um workspace
  async listarPorWorkspace(workspaceId: string): Promise<Fluxograma[]> {
    const response = await apiClient.get<ApiResponse<Fluxograma[]>>(
      `/workspaces/${workspaceId}/fluxogramas`
    );

    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }

    throw new Error(response.data.mensagem || 'Erro ao listar fluxogramas do workspace');
  },
  
  // Buscar fluxograma por ID
  async buscarPorId(id: string): Promise<Fluxograma> {
    const response = await apiClient.get<ApiResponse<Fluxograma>>(`/fluxogramas/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Fluxograma não encontrado');
  },
  
  // Criar fluxograma
  async criar(dados: CriarFluxogramaDTO): Promise<Fluxograma> {
    console.log('fluxogramaServico.criar payload:', dados)
    const response = await apiClient.post<ApiResponse<Fluxograma>>('/fluxogramas', dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao criar fluxograma');
  },
  
  // Atualizar fluxograma (salvar alterações do Excalidraw)
  async atualizar(id: string, dados: Partial<CriarFluxogramaDTO>): Promise<Fluxograma> {
    console.log('fluxogramaServico.atualizar id, payload:', id, dados)
    const response = await apiClient.patch<ApiResponse<Fluxograma>>(`/fluxogramas/${id}`, dados);
    
    if (response.data.sucesso && response.data.dados) {
      return response.data.dados;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao salvar fluxograma');
  },
  
  // Excluir fluxograma
  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/fluxogramas/${id}`);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagem || 'Erro ao excluir fluxograma');
    }
  },
  
  // Exportar fluxograma como imagem
  async exportarImagem(id: string, formato: 'png' | 'svg' = 'png'): Promise<Blob> {
    const response = await apiClient.get(`/fluxogramas/${id}/exportar`, {
      params: { formato },
      responseType: 'blob',
    });
    
    return response.data;
  },
};

export default fluxogramaServico;
