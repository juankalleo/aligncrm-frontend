 'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contextos';
import { AuthLayout } from '@/layouts';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { workspaceServico, projetoServico } from '@/servicos';
import toast from 'react-hot-toast';

export default function SelecionarWorkspacePage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [pendingSolicitations, setPendingSolicitations] = useState<any[]>([]);
  
  useEffect(() => {
    (async () => {
      try {
        const [ws, solicitacoes] = await Promise.all([
          workspaceServico.listar(),
          projetoServico.minhasSolicitacoes()
        ]);
        setWorkspaces(ws || []);
        setPendingSolicitations(solicitacoes || []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleEnterWorkspace = (workspaceId: string) => {
    try { localStorage.setItem('workspaceId', workspaceId) } catch (e) {}
    // Use setTimeout to avoid DOM manipulation issues during navigation
    setTimeout(() => {
      router.push(`/${workspaceId}/dashboard`);
    }, 0);
  }

  return (
    <AuthLayout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold mb-4">Em qual grupo de trabalho deseja entrar?</h2>
          <Button variant="ghost" onClick={() => setJoinOpen(true)}>Ingressar em grupo de trabalho</Button>
        </div>

        {workspaces.length === 0 && (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
              Nenhum grupo de trabalho disponível
            </h3>
            <p className="text-yellow-800 dark:text-yellow-300 text-sm mb-3">
              Você ainda não pertence a nenhum grupo de trabalho.
              {pendingSolicitations.length > 0 && (
                <span>
                  {' '}Você tem {pendingSolicitations.length} solicitação(ões) pendente(s) para:
                  <ul className="list-disc list-inside mt-2 ml-2">
                    {pendingSolicitations.map((sol: any) => (
                      <li key={sol.id}>
                        <strong>{sol.projeto?.workspace?.nome || sol.projeto?.nome || 'Grupo'}</strong>
                        {sol.projeto?.workspace?.nome && sol.projeto?.nome && ` (Projeto: ${sol.projeto.nome})`}
                      </li>
                    ))}
                  </ul>
                  Aguarde a aprovação do administrador.
                </span>
              )}
              {pendingSolicitations.length === 0 && ' Use o botão abaixo para solicitar ingresso em um grupo.'}
            </p>
            <Button 
              variant="primary" 
              onClick={() => setJoinOpen(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Solicitar ingresso em grupo
            </Button>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {workspaces.map((w: any) => (
            <div key={w.id} className="p-4 bg-light-card dark:bg-dark-card rounded-lg border-light-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">{w.nome}</div>
                  <div className="text-sm text-light-muted">ID: {w.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleEnterWorkspace(w.id)}>Entrar no grupo</Button>
                </div>
              </div>
              
            </div>
          ))}
        </div>

        <Modal isOpen={joinOpen} onClose={() => setJoinOpen(false)} title="Ingressar em grupo de trabalho" size="sm">
          <div className="space-y-4">
            <Input placeholder="Código ou nome do grupo" value={joinCode} onChange={(e:any) => setJoinCode(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setJoinOpen(false)}>Cancelar</Button>
              <Button isLoading={isJoining} onClick={async () => {
                setIsJoining(true);
                try {
                  if (!joinCode || joinCode.trim().length === 0) throw new Error('Informe o código ou nome do grupo');
                  await projetoServico.solicitarIngressoPorCodigo(joinCode.trim(), 'Solicitação via app');
                  toast.success('Solicitação enviada ao administrador do grupo.');
                  setJoinOpen(false);
                } catch (err: any) {
                  const serverMsg = err?.response?.data?.mensagem || err?.response?.data?.message;
                  const m = serverMsg || (err instanceof Error ? err.message : 'Erro ao solicitar ingresso');
                  toast.error(m);
                } finally { setIsJoining(false); }
              }}>Solicitar ingresso</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthLayout>
  );
}
