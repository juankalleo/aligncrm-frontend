"use client"

import React, { useEffect, useState } from 'react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Form'
import vpsServico from '@/servicos/vpsServico'
import { Vps } from '@/tipos'
import { Plus, Edit, Trash2, Server } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const vpsSchema = z.object({
  nome: z.string().min(2),
  login_root: z.string().min(1),
  senha_root: z.string().optional(),
  email_relacionado: z.string().email().optional(),
  storage_gb: z.number().optional(),
  comprado_em_local: z.string().optional(),
  comprado_em: z.string().optional(),
})

type VpsForm = z.infer<typeof vpsSchema>

export default function VpsPage() {
  const [vpsList, setVpsList] = useState<Vps[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vps | null>(null)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Vps | null>(null)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<VpsForm>({
    resolver: zodResolver(vpsSchema),
  })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      const res = await vpsServico.listar()
      setVpsList(res || [])
    } catch (err) {
      console.error('Erro ao carregar VPSs', err)
    } finally {
      setLoading(false)
    }
  }

  function abrirModal(v?: Vps) {
    if (v) {
      setEditing(v)
      reset({
        nome: v.nome,
        login_root: v.login_root,
        senha_root: v.senha_root || undefined,
        email_relacionado: v.email_relacionado || undefined,
        storage_gb: v.storage_gb || undefined,
        comprado_em_local: v.comprado_em_local || undefined,
        comprado_em: v.comprado_em ? String(v.comprado_em).split('T')[0] : undefined,
      })
    } else {
      setEditing(null)
      reset({})
    }
    setModalOpen(true)
  }

  function fecharModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data: VpsForm) {
    try {
      const payload: any = {
        nome: data.nome,
        login_root: data.login_root,
        senha_root: data.senha_root || null,
        email_relacionado: data.email_relacionado || null,
        storage_gb: data.storage_gb || null,
        comprado_em_local: data.comprado_em_local || null,
        comprado_em: data.comprado_em || null,
      }
      if (editing) {
        await vpsServico.atualizar(editing.id, payload)
      } else {
        await vpsServico.criar(payload)
      }
      await carregar()
      fecharModal()
    } catch (err) {
      console.error('Erro ao salvar VPS', err)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Confirma exclusão da VPS?')) return
    try {
      await vpsServico.excluir(id)
      await carregar()
    } catch (err) {
      console.error('Erro ao excluir VPS', err)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">VPS e Senhas</h1>
            <p className="text-sm text-light-muted">Cadastre servidores VPS, credenciais e projetos rodando neles.</p>
          </div>
          <Button onClick={() => abrirModal()}>
            <Plus className="w-4 h-4 mr-2" /> Nova VPS
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : vpsList.length === 0 ? (
          <Card className="text-center py-12">
            <Server className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Nenhuma VPS cadastrada</h3>
            <p className="text-gray-500 mt-2">Adicione sua VPS com login root e senha</p>
            <Button onClick={() => abrirModal()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Adicionar VPS
            </Button>
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Input placeholder="Filtrar por nome ou email" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <Button variante="ghost" onClick={() => { setFilter('') }}>Limpar</Button>
            </div>

            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-light-muted border-b border-light-border dark:border-dark-border">
                    <th className="py-3 px-2">Nome</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Storage (GB)</th>
                    <th className="py-3 px-2">Comprado em</th>
                    <th className="py-3 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vpsList.filter(v => {
                    const q = filter.trim().toLowerCase()
                    if (!q) return true
                    return v.nome.toLowerCase().includes(q) || (v.email_relacionado || '').toLowerCase().includes(q)
                  }).map((v) => (
                    <tr key={v.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover">
                      <td className="py-3 px-2 align-top">
                        <button className="text-left" onClick={() => setSelected(v)}>
                          <div className="font-medium">{v.nome}</div>
                          <div className="text-sm text-light-muted">{v.login_root}</div>
                        </button>
                      </td>
                      <td className="py-3 px-2 align-top">{v.email_relacionado || '—'}</td>
                      <td className="py-3 px-2 align-top">{v.storage_gb ?? '—'}</td>
                      <td className="py-3 px-2 align-top">{v.comprado_em ? String(v.comprado_em).split('T')[0] : '—'}</td>
                      <td className="py-3 px-2 align-top">
                        <div className="flex gap-2">
                          <Button variante="ghost" onClick={() => abrirModal(v)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variante="ghost" onClick={() => excluir(v.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={fecharModal} titulo={editing ? 'Editar VPS' : 'Nova VPS'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Nome" {...register('nome')} erro={errors.nome?.message as any} />
            <Input label="Login root" {...register('login_root')} erro={errors.login_root?.message as any} />
            <Input label="Senha root" type="password" {...register('senha_root')} />
            <Input label="Email relacionado" {...register('email_relacionado')} />
            <Input label="Storage (GB)" type="number" {...register('storage_gb' as any)} />
            <Input label="Onde foi comprada" {...register('comprado_em_local')} />
            <Input label="Data de compra" type="date" {...register('comprado_em')} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variante="ghost" onClick={fecharModal}>Cancelar</Button>
              <Button type="submit">{editing ? 'Salvar' : 'Adicionar'}</Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!selected} onClose={() => setSelected(null)} titulo="Detalhes da VPS">
          {selected && (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-lg">{selected.nome}</h3>
                <p className="text-sm text-light-muted">{selected.comprado_em_local || '—'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Login root:</strong> {selected.login_root}</div>
                <div><strong>Senha:</strong> {selected.senha_root ? '••••••••' : '—'}</div>
                <div><strong>Email:</strong> {selected.email_relacionado || '—'}</div>
                <div><strong>Storage (GB):</strong> {selected.storage_gb ?? '—'}</div>
                <div><strong>Comprado em:</strong> {selected.comprado_em ? String(selected.comprado_em).split('T')[0] : '—'}</div>
                <div><strong>Projetos:</strong> {selected.projetos && selected.projetos.length > 0 ? selected.projetos.map(p => p.nome).join(', ') : '—'}</div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variante="ghost" onClick={() => { setSelected(null); abrirModal(selected); }}>Editar</Button>
                <Button variante="ghost" onClick={() => { if (selected) { excluir(selected.id); setSelected(null); } }}>Excluir</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  )
}
