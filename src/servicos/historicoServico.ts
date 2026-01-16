import apiClient from './api';
import { 
  RegistroHistorico, 
  FiltrosHistorico,
  ApiResponse, 
  PaginatedResponse 
} from '@/tipos';

// Serviço de Histórico (Audit Log)
export const historicoServico = {
  // Listar histórico com filtros
  async listar(filtros?: FiltrosHistorico): Promise<PaginatedResponse<RegistroHistorico>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<RegistroHistorico>>>(
      '/historico',
      { params: filtros }
    );
    
    if (response.data.sucesso && response.data.dados) {
      // Normalize backend snake_case to frontend camelCase + detalhes -> mudancas
      const dados = response.data.dados.dados.map(r => ({
        ...r,
        entidadeId: (r as any).entidade_id,
        entidadeNome: (r as any).entidade_nome,
        usuarioId: (r as any).usuario_id,
        mudancas: (r as any).detalhes,
        criadoEm: (r as any).criado_em,
      }))

      return {
        dados,
        meta: response.data.dados.meta,
      } as PaginatedResponse<RegistroHistorico>;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar histórico');
  },
  
  // Buscar registro por ID
  async buscarPorId(id: string): Promise<RegistroHistorico> {
    const response = await apiClient.get<ApiResponse<RegistroHistorico>>(`/historico/${id}`);
    
    if (response.data.sucesso && response.data.dados) {
      const r = response.data.dados as any
      return {
        ...r,
        entidadeId: r.entidade_id,
        entidadeNome: r.entidade_nome,
        usuarioId: r.usuario_id,
        mudancas: r.detalhes,
        criadoEm: r.criado_em,
      }
    }
    
    throw new Error(response.data.mensagem || 'Registro não encontrado');
  },
  
  // Histórico de um projeto específico
  async porProjeto(
    projetoId: string, 
    pagina = 1, 
    porPagina = 50
  ): Promise<PaginatedResponse<RegistroHistorico>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<RegistroHistorico>>>(
      `/projetos/${projetoId}/historico`,
      { params: { pagina, porPagina } }
    );
    
    if (response.data.sucesso && response.data.dados) {
      const dados = response.data.dados.dados.map(r => ({
        ...r,
        entidadeId: (r as any).entidade_id,
        entidadeNome: (r as any).entidade_nome,
        usuarioId: (r as any).usuario_id,
        mudancas: (r as any).detalhes,
        criadoEm: (r as any).criado_em,
      }))

      return {
        dados,
        meta: response.data.dados.meta,
      } as PaginatedResponse<RegistroHistorico>;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar histórico do projeto');
  },

  // Histórico de um workspace
  async porWorkspace(
    workspaceId: string,
    filtrosOrPagina?: FiltrosHistorico | number,
    porPaginaArg?: number
  ): Promise<PaginatedResponse<RegistroHistorico>> {
    let params: any = {};
    if (typeof filtrosOrPagina === 'number') {
      params.pagina = filtrosOrPagina;
      if (porPaginaArg) params.porPagina = porPaginaArg;
    } else {
      params = { ...(filtrosOrPagina || {}) } as any;
    }

    const response = await apiClient.get<ApiResponse<any>>(
      `/workspaces/${workspaceId}/historico`,
      { params }
    );

    if (response.data.sucesso) {
      const payload = response.data.dados;
      let items: any[] = [];
      let meta: any = { total: 0, pagina: params.pagina || 1, porPagina: params.porPagina || 50, totalPaginas: 1 };

      if (Array.isArray(payload)) {
        items = payload;
        if (response.data.meta) meta = response.data.meta;
      } else if (payload && Array.isArray(payload.dados)) {
        items = payload.dados;
        meta = payload.meta || meta;
      } else if (payload && typeof payload === 'object' && payload !== null && payload.length === undefined) {
        // single object or unexpected shape
        items = Array.isArray(payload) ? payload : [];
      }

      const dados = items.map(r => ({
        ...r,
        entidadeId: (r as any).entidade_id,
        entidadeNome: (r as any).entidade_nome,
        usuarioId: (r as any).usuario_id,
        mudancas: (r as any).detalhes,
        criadoEm: (r as any).criado_em,
      }))

      return {
        dados,
        meta,
      } as PaginatedResponse<RegistroHistorico>;
    }

    throw new Error(response.data.mensagem || 'Erro ao listar histórico do workspace');
  },
  
  // Histórico de um usuário específico
  async porUsuario(
    usuarioId: string, 
    pagina = 1, 
    porPagina = 50
  ): Promise<PaginatedResponse<RegistroHistorico>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<RegistroHistorico>>>(
      `/usuarios/${usuarioId}/historico`,
      { params: { pagina, porPagina } }
    );
    
    if (response.data.sucesso && response.data.dados) {
      const dados = response.data.dados.dados.map(r => ({
        ...r,
        entidadeId: (r as any).entidade_id,
        entidadeNome: (r as any).entidade_nome,
        usuarioId: (r as any).usuario_id,
        mudancas: (r as any).detalhes,
        criadoEm: (r as any).criado_em,
      }))

      return {
        dados,
        meta: response.data.dados.meta,
      } as PaginatedResponse<RegistroHistorico>;
    }
    
    throw new Error(response.data.mensagem || 'Erro ao listar histórico do usuário');
  },
  
  // Exportar histórico (CSV)
  async exportar(filtros?: FiltrosHistorico, workspaceId?: string): Promise<Blob> {
    const url = workspaceId ? `/workspaces/${workspaceId}/historico/exportar` : '/historico/exportar'
    const response = await apiClient.get(url, {
      params: filtros,
      responseType: 'blob',
    });

    return response.data;
  },
};

export default historicoServico;
