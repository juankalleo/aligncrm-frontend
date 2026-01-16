"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/layouts';
import useProjetoStore from '@/contextos/ProjetoStore'
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contextos';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const registroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type RegistroForm = z.infer<typeof registroSchema>;

export default function RegistroContaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registrar, isLoading, usuario } = useAuth();
  const selecionarProjeto = useProjetoStore(state => state.selecionarProjeto)
  const projetoAtual = useProjetoStore(state => state.projetoAtual)
  const [showPassword, setShowPassword] = useState(false);

  const [flow, setFlow] = useState<'none' | 'create' | 'join'>('none');
  const [createDraft, setCreateDraft] = useState({ nome: '', codigo: '', aceitarTermos: false });
  const [joinDraft, setJoinDraft] = useState({ codigo: '', projetoId: '' });

  useEffect(() => {
    const f = searchParams.get('flow');
    if (f === 'create' || f === 'join') setFlow(f);
    const nome = searchParams.get('nome');
    const codigo = searchParams.get('codigo');
    const projetoId = searchParams.get('projetoId');
    const aceitar = searchParams.get('aceitarTermos');
    if (nome || codigo) setCreateDraft(d => ({ ...d, nome: nome || d.nome, codigo: codigo || d.codigo, aceitarTermos: aceitar === '1' }));
    if (projetoId || codigo) setJoinDraft(d => ({ ...d, projetoId: projetoId || d.projetoId, codigo: codigo || d.codigo }));
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
  });

  const onSubmit = async (data: RegistroForm) => {
    try {
      await registrar({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        confirmarSenha: data.confirmarSenha,
      });
      toast.success('Conta criada com sucesso!');

      if (flow === 'join' && (joinDraft.projetoId || joinDraft.codigo)) {
        try {
          const projetoServico = (await import('@/servicos/projetoServico')).projetoServico;
          let targetId = joinDraft.projetoId;
          if (!targetId && joinDraft.codigo) {
            try {
              const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspaceId') : null;
              const res = workspaceId ? await projetoServico.listarPorWorkspace(workspaceId, 1, 100) : await projetoServico.listar(1, 100);
              const found = (res.dados || []).find((p: any) => (p.id === joinDraft.codigo) || (p.nome === joinDraft.codigo));
              targetId = found?.id;
            } catch (err) {
              // ignore
            }
          }

          if (targetId) {
            try {
              const solicitacaoClient = (await import('@/servicos/projetoServico')).projetoServico;
              if (solicitacaoClient && solicitacaoClient.solicitarIngresso) {
                await solicitacaoClient.solicitarIngresso(targetId);
              } else {
                await projetoServico.adicionarMembro(targetId, usuario?.id || '');
              }
              toast.success('Solicitação de ingresso enviada! Aguarde a aprovação do administrador.');
            } catch (err) {
              toast.success('Solicitação enviada ao administrador do grupo.');
            }
          } else {
            toast.error('Não foi possível localizar o grupo pelo código informado.');
          }
        } catch (err) {
          console.error('Erro ao enviar solicitação:', err);
        }
        toast.info('Faça login para acessar o sistema.');
        router.push('/login');
        return;
      }

      try {
        if (flow === 'create' && createDraft.nome && createDraft.aceitarTermos) {
          const projetoServico = (await import('@/servicos/projetoServico')).projetoServico;
          const novo = await projetoServico.criar({ nome: createDraft.nome });
          toast.success('Grupo de trabalho criado e você é o admin.');
          if (novo?.id) {
            try { if (novo.workspace && novo.workspace.id) localStorage.setItem('workspaceId', novo.workspace.id) } catch (e) {}
            await selecionarProjeto(novo.id);
            router.push(`/dashboard`);
            return;
          }
        }
      } catch (err) {
        console.error('Erro no fluxo de workspace:', err);
      }

      const prefix = projetoAtual ? `/${projetoAtual.id}` : '';
      router.push(`${prefix}/dashboard`);
    } catch (error) {
      const err: any = error;
      const serverErrors: string[] = err?.errors || err?.response?.data?.erros || [];
      const status: number | undefined = err?.status || err?.response?.status;
      const message = err instanceof Error ? err.message : (err?.response?.data?.mensagem || 'Erro ao criar conta');

      const isEmailError = serverErrors.some(e => e.toLowerCase().includes('email')) || message.toLowerCase().includes('email');
      if (status === 422 && isEmailError) {
        toast.error('Já existe uma conta com esse email. Faça login para associar-se a outro grupo.');
        const params = new URLSearchParams();
        params.set('email', (data as any).email);
        if (flow) params.set('flow', flow);
        if (flow === 'create') {
          if (createDraft.nome) params.set('nome', createDraft.nome);
          if (createDraft.codigo) params.set('codigo', createDraft.codigo);
          if (createDraft.aceitarTermos) params.set('aceitarTermos', '1');
        }
        if (flow === 'join') {
          if (joinDraft.codigo) params.set('codigo', joinDraft.codigo);
          if (joinDraft.projetoId) params.set('projetoId', joinDraft.projetoId);
        }

        router.push('/login?' + params.toString());
        return;
      }

      toast.error(message);
    }
  };

  return (
    <AuthLayout hideSubtitle>
      <div>
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">Criar conta</h2>
        <p className="text-light-muted dark:text-dark-muted mb-8">Preencha os dados abaixo para começar</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nome completo"
            type="text"
            placeholder="Seu nome"
            iconeEsquerda={<User size={18} />}
            erro={errors.nome?.message}
            {...register('nome')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            iconeEsquerda={<Mail size={18} />}
            erro={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            iconeEsquerda={<Lock size={18} />}
            iconeDireita={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-light-text dark:hover:text-dark-text"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            erro={errors.senha?.message}
            {...register('senha')}
          />

          <Input
            label="Confirmar senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            iconeEsquerda={<Lock size={18} />}
            erro={errors.confirmarSenha?.message}
            {...register('confirmarSenha')}
          />

          <Button
            type="submit"
            className="w-full"
            tamanho="lg"
            isLoading={isLoading}
          >
            Criar conta
          </Button>
        </form>

      </div>
    </AuthLayout>
  );
}
