'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contextos/AuthContext'
import useProjetoStore from '@/contextos/ProjetoStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/registro', '/esqueci-senha']

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { usuario, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const projetoAtual = useProjetoStore(state => state.projetoAtual)

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (!usuario && !isPublicRoute) {
        // Não autenticado tentando acessar rota protegida
        router.push('/login')
      } else if (usuario && isPublicRoute) {
        // Autenticado tentando acessar rota pública
        const prefix = projetoAtual ? `/${projetoAtual.id}` : ''
        router.push(`${prefix}/dashboard`)
      }
    }
  }, [usuario, loading, pathname, router])

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-align-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se está em rota pública e não autenticado, ou em rota protegida e autenticado
  const isPublicRoute = publicRoutes.includes(pathname)
  if ((!usuario && isPublicRoute) || (usuario && !isPublicRoute)) {
    return <>{children}</>
  }

  // Se não atende nenhuma condição, não renderiza nada
  // (o useEffect vai redirecionar)
  return null
}
