'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/layouts';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contextos';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const resp = await login({ email: data.email, senha: data.senha });
      toast.success('Login realizado com sucesso!');

      // Always go to workspace selector so user can choose or join workspaces
      router.push('/selecionar-workspace');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    }
  };

  return (
    <AuthLayout>
      <div className="sm:pt-6">

        

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            type="email"
            placeholder="seu@email.com"
            iconeEsquerda={<span className="text-white"><Mail size={18} /></span>}
            erro={errors.email?.message}
            className="bg-gray-700 text-white placeholder-white/60 border-transparent focus:ring-white/40"
            {...register('email')}
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            iconeEsquerda={<span className="text-white"><Lock size={18} /></span>}
            iconeDireita={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white hover:opacity-90"
              >
                {showPassword ? <span className="text-white"><EyeOff size={18} /></span> : <span className="text-white"><Eye size={18} /></span>}
              </button>
            }
            erro={errors.senha?.message}
            className="bg-gray-700 text-white placeholder-white/60 border-transparent focus:ring-white/40"
            {...register('senha')}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-light-border" />
              <span className="text-sm text-light-muted dark:text-dark-muted">
                Lembrar-me
              </span>
            </label>
            <Link href="/recuperar-senha" className="text-sm text-align-600 hover:text-align-700">
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            tamanho="lg"
            isLoading={isLoading}
          >
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-light-muted dark:text-dark-muted">
          Não tem uma conta?{' '}
          <Link href="/registro" className="text-align-600 hover:text-align-700 font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
