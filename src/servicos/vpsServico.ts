import apiClient from './api';
import { Vps, ApiResponse, CriarVpsDTO } from '@/tipos';

const vpsServico = {
  async listar(): Promise<Vps[]> {
    const response = await apiClient.get<ApiResponse<Vps[]>>('/vps');
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao listar VPSs');
  },

  async buscarPorId(id: string): Promise<Vps> {
    const response = await apiClient.get<ApiResponse<Vps>>(`/vps/${id}`);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'VPS não encontrada');
  },

  async criar(dados: CriarVpsDTO): Promise<Vps> {
    const response = await apiClient.post<ApiResponse<Vps>>('/vps', dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao criar VPS');
  },

  async atualizar(id: string, dados: Partial<CriarVpsDTO>): Promise<Vps> {
    const response = await apiClient.patch<ApiResponse<Vps>>(`/vps/${id}`, dados);
    if (response.data.sucesso && response.data.dados) return response.data.dados;
    throw new Error(response.data.mensagem || 'Erro ao atualizar VPS');
  },

  async excluir(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/vps/${id}`);
    if (!response.data.sucesso) throw new Error(response.data.mensagem || 'Erro ao excluir VPS');
  },
};

export default vpsServico;
