'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Moon,
  Sun,
  Monitor,
  Save,
  Layout,
  Sparkles,
  Square,
  Camera,
  Upload
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card, Avatar } from '@/components/ui/Elements'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { useTema, Tema, SidebarEstilo } from '@/contextos/TemaContext'
import { useAuth } from '@/contextos/AuthContext'
import { usuarioServico } from '@/servicos/usuarioServico'
import toast from 'react-hot-toast'

const temaIcones: Record<Tema, React.ElementType> = {
  'claro': Sun,
  'escuro': Moon,
  'sistema': Monitor,
}

const temaLabels: Record<Tema, string> = {
  'claro': 'Claro',
  'escuro': 'Escuro',
  'sistema': 'Sistema',
}

const sidebarLabels: Record<SidebarEstilo, string> = {
  'padrao': 'Padrão',
  'glass': 'Glassmorphism',
  'minimal': 'Minimal',
}

const sidebarIcones: Record<SidebarEstilo, React.ElementType> = {
  'padrao': Layout,
  'glass': Sparkles,
  'minimal': Square,
}

export default function ConfiguracoesPage() {
  const { tema, setTema, sidebarEstilo, setSidebarEstilo } = useTema()
  const { usuario, atualizarUsuarioLocal } = useAuth()
  
  const [formPerfil, setFormPerfil] = React.useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
  })

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)

  const [notificacoes, setNotificacoes] = React.useState({
    email: true,
    push: true,
    tarefas: true,
    projetos: true,
    mencoes: true,
  })

  const handleSalvarPerfil = () => {
    // Implementar salvamento
    console.log('Salvando perfil:', formPerfil)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile || !usuario) return
    
    setUploadingAvatar(true)
    try {
      const avatarUrl = await usuarioServico.uploadAvatar(usuario.id, avatarFile)
      toast.success('Foto de perfil atualizada!')

      // Atualiza apenas o estado local do usuário (já foi feito o upload)
      atualizarUsuarioLocal({ avatar: avatarUrl })
      
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (err) {
      console.error('Erro ao atualizar foto:', err)
      toast.error('Erro ao atualizar foto de perfil')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSalvarNotificacoes = () => {
    // Implementar salvamento
    console.log('Salvando notificações:', notificacoes)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personalize sua experiência no Align
          </p>
        </div>

        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-align-100 dark:bg-align-900 flex items-center justify-center">
                <User className="w-5 h-5 text-align-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Perfil</h2>
                <p className="text-sm text-gray-500">Suas informações pessoais</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : usuario?.avatar ? (
                    <Avatar nome={usuario?.nome || ''} src={usuario.avatar} tamanho="xl" className="w-20 h-20" />
                  ) : (
                    <Avatar nome={usuario?.nome || ''} tamanho="xl" className="w-20 h-20" />
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-align-600 hover:bg-align-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Foto de perfil
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Clique no ícone da câmera para selecionar uma nova foto
                  </p>
                  {avatarFile && (
                    <Button
                      onClick={handleUploadAvatar}
                      isLoading={uploadingAvatar}
                      tamanho="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Fazer Upload
                    </Button>
                  )}
                </div>
              </div>

              <Input
                label="Nome"
                value={formPerfil.nome}
                onChange={(e) => setFormPerfil({ ...formPerfil, nome: e.target.value })}
              />
              <Input
                label="E-mail"
                type="email"
                value={formPerfil.email}
                onChange={(e) => setFormPerfil({ ...formPerfil, email: e.target.value })}
              />
              <div className="flex justify-end">
                <Button onClick={handleSalvarPerfil}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Perfil
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Aparência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Aparência</h2>
                <p className="text-sm text-gray-500">Personalize a interface</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Tema */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tema
                </label>
                <div className="flex gap-3">
                  {(['claro', 'escuro', 'sistema'] as const).map((t) => {
                    const Icone = temaIcones[t]
                    return (
                      <button
                        key={t}
                        onClick={() => setTema(t)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          tema === t
                            ? 'border-align-500 bg-align-50 dark:bg-align-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icone className={`w-6 h-6 mx-auto mb-2 ${
                          tema === t ? 'text-align-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm ${
                          tema === t ? 'text-align-500 font-medium' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {temaLabels[t]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Estilo da Sidebar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Estilo da Sidebar
                </label>
                <div className="flex gap-3">
                  {(['padrao', 'glass', 'minimal'] as const).map((s) => {
                    const Icone = sidebarIcones[s]
                    return (
                      <button
                        key={s}
                        onClick={() => setSidebarEstilo(s)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          sidebarEstilo === s
                            ? 'border-align-500 bg-align-50 dark:bg-align-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icone className={`w-6 h-6 mx-auto mb-2 ${
                          sidebarEstilo === s ? 'text-align-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm ${
                          sidebarEstilo === s ? 'text-align-500 font-medium' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {sidebarLabels[s]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notificações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Notificações</h2>
                <p className="text-sm text-gray-500">Gerencie como você recebe alertas</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleOption
                label="Notificações por e-mail"
                description="Receba atualizações importantes por e-mail"
                checked={notificacoes.email}
                onChange={(checked) => setNotificacoes({ ...notificacoes, email: checked })}
              />
              <ToggleOption
                label="Notificações push"
                description="Receba notificações no navegador"
                checked={notificacoes.push}
                onChange={(checked) => setNotificacoes({ ...notificacoes, push: checked })}
              />
              <ToggleOption
                label="Atualizações de tarefas"
                description="Seja notificado sobre mudanças em suas tarefas"
                checked={notificacoes.tarefas}
                onChange={(checked) => setNotificacoes({ ...notificacoes, tarefas: checked })}
              />
              <ToggleOption
                label="Atualizações de projetos"
                description="Receba alertas sobre projetos que você participa"
                checked={notificacoes.projetos}
                onChange={(checked) => setNotificacoes({ ...notificacoes, projetos: checked })}
              />
              <ToggleOption
                label="Menções"
                description="Seja alertado quando for mencionado"
                checked={notificacoes.mencoes}
                onChange={(checked) => setNotificacoes({ ...notificacoes, mencoes: checked })}
              />

              <div className="flex justify-end pt-4">
                <Button onClick={handleSalvarNotificacoes}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Segurança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Segurança</h2>
                <p className="text-sm text-gray-500">Proteja sua conta</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Alterar senha</h4>
                  <p className="text-sm text-gray-500">Atualize sua senha periodicamente</p>
                </div>
                <Button variante="ghost">Alterar</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Sessões ativas</h4>
                  <p className="text-sm text-gray-500">Gerencie dispositivos conectados</p>
                </div>
                <Button variante="ghost">Ver sessões</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Autenticação em dois fatores</h4>
                  <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
                </div>
                <Button variante="ghost">Configurar</Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Dados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Dados</h2>
                <p className="text-sm text-gray-500">Gerencie seus dados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Exportar dados</h4>
                  <p className="text-sm text-gray-500">Baixe uma cópia dos seus dados</p>
                </div>
                <Button variante="ghost">Exportar</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-400">Excluir conta</h4>
                  <p className="text-sm text-red-600 dark:text-red-500">Esta ação não pode ser desfeita</p>
                </div>
                <Button variante="danger">Excluir</Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}

// Componente Toggle
function ToggleOption({ 
  label, 
  description, 
  checked, 
  onChange 
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-align-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span 
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
