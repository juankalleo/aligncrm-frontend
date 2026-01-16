import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  setPagina: (pagina: number) => void;
  setPorPagina: (porPagina: number) => void;
  setTotalPaginas: (total: number) => void;
  irParaPrimeira: () => void;
  irParaUltima: () => void;
  irParaProxima: () => void;
  irParaAnterior: () => void;
  podeIrProxima: boolean;
  podeIrAnterior: boolean;
}

export function usePagination(
  paginaInicial = 1,
  porPaginaInicial = 20
): UsePaginationReturn {
  const [pagina, setPaginaState] = useState(paginaInicial);
  const [porPagina, setPorPaginaState] = useState(porPaginaInicial);
  const [totalPaginas, setTotalPaginasState] = useState(1);

  const setPagina = useCallback((novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaState(novaPagina);
    }
  }, [totalPaginas]);

  const setPorPagina = useCallback((novoValor: number) => {
    setPorPaginaState(novoValor);
    setPaginaState(1); // Resetar para primeira página
  }, []);

  const setTotalPaginas = useCallback((total: number) => {
    setTotalPaginasState(Math.max(1, total));
  }, []);

  const irParaPrimeira = useCallback(() => setPagina(1), [setPagina]);
  const irParaUltima = useCallback(() => setPagina(totalPaginas), [setPagina, totalPaginas]);
  const irParaProxima = useCallback(() => setPagina(pagina + 1), [setPagina, pagina]);
  const irParaAnterior = useCallback(() => setPagina(pagina - 1), [setPagina, pagina]);

  return {
    pagina,
    porPagina,
    totalPaginas,
    setPagina,
    setPorPagina,
    setTotalPaginas,
    irParaPrimeira,
    irParaUltima,
    irParaProxima,
    irParaAnterior,
    podeIrProxima: pagina < totalPaginas,
    podeIrAnterior: pagina > 1,
  };
}

export default usePagination;
