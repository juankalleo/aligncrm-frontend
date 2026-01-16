'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/layouts';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

export default function RegistroGrupoPage() {
  const router = useRouter();

  const [flow, setFlow] = useState<'none' | 'create' | 'join'>('none');
  const [createDraft, setCreateDraft] = useState({ nome: '', codigo: '', aceitarTermos: false });
  const [joinDraft, setJoinDraft] = useState({ codigo: '', projetoId: '' });
  const [modalOpen, setModalOpen] = useState(false);

  const handleContinue = () => {
    const params = new URLSearchParams();
    params.set('flow', flow);
    if (flow === 'create') {
      if (createDraft.nome) params.set('nome', createDraft.nome);
      if (createDraft.codigo) params.set('codigo', createDraft.codigo);
      if (createDraft.aceitarTermos) params.set('aceitarTermos', '1');
    }
    if (flow === 'join') {
      if (joinDraft.codigo) params.set('codigo', joinDraft.codigo);
      if (joinDraft.projetoId) params.set('projetoId', joinDraft.projetoId);
    }

    router.push('/registro/conta?' + params.toString());
  };

  return (
    <AuthLayout hideSubtitle>
      <div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`p-6 rounded-xl border cursor-pointer ${flow === 'create' ? 'border-align-500 shadow-lg' : 'border-light-border'} bg-light-card dark:bg-dark-card`}
            onClick={() => { setFlow('create'); setModalOpen(true); }}
          >
            <h3 className="text-lg font-semibold mb-2">Criar grupo de trabalho</h3>
            <p className="text-sm text-light-muted dark:text-dark-muted">Você será o administrador do grupo e poderá adicionar membros.</p>
          </div>

          <div
            className={`p-6 rounded-xl border cursor-pointer ${flow === 'join' ? 'border-align-500 shadow-lg' : 'border-light-border'} bg-light-card dark:bg-dark-card`}
            onClick={() => { setFlow('join'); setModalOpen(true); }}
          >
            <h3 className="text-lg font-semibold mb-2">Ingressar em grupo de trabalho</h3>
            <p className="text-sm text-light-muted dark:text-dark-muted">Procure grupos existentes ou entre pelo código do grupo e solicite acesso.</p>
          </div>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={flow === 'create' ? 'Criar grupo de trabalho' : 'Ingressar em grupo'} size="sm">
          {flow === 'create' ? (
            <div className="space-y-4">
              <Input placeholder="Nome do grupo" value={createDraft.nome} onChange={(e: any) => setCreateDraft(d => ({ ...d, nome: e.target.value }))} />
              <Input placeholder="Código do grupo (opcional)" value={createDraft.codigo} onChange={(e: any) => setCreateDraft(d => ({ ...d, codigo: e.target.value }))} />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={createDraft.aceitarTermos} onChange={(e:any) => setCreateDraft(d => ({ ...d, aceitarTermos: e.target.checked }))} />
                <span className="text-sm text-light-muted dark:text-dark-muted">Li e aceito os termos de criação do grupo</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => { setModalOpen(false); handleContinue(); }}>Salvar e continuar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Código do grupo" value={joinDraft.codigo} onChange={(e:any) => setJoinDraft(d => ({ ...d, codigo: e.target.value }))} />
              <Input placeholder="Ou cole o ID do grupo" value={joinDraft.projetoId} onChange={(e:any) => setJoinDraft(d => ({ ...d, projetoId: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => { setModalOpen(false); handleContinue(); }}>Salvar e continuar</Button>
              </div>
            </div>
          )}
        </Modal>

        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">Criar conta</h2>
        <p className="text-light-muted dark:text-dark-muted mb-8">Escolha como quer entrar no Align antes de criar sua conta.</p>
      </div>
    </AuthLayout>
  );
}
