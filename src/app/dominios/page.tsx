"use client"

import React, { useEffect, useState } from 'react'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/Form'
import { Card } from '@/components/ui/Elements'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Form'
import { dominioServico } from '@/servicos'
import { Dominio } from '@/tipos'
import { Plus, Edit, Trash2, Globe } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const dominioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  porta: z.string().optional(),
  nginx_server: z.string().optional(),
  expires_at: z.string().optional(),
  notified: z.boolean().optional(),
})

type DominioForm = z.infer<typeof dominioSchema>

export default function DominiosPage() {
  const [dominios, setDominios] = useState<Dominio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dominio | null>(null)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Dominio | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DominioForm>({
    resolver: zodResolver(dominioSchema),
  })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      const res = await dominioServico.listar()
      setDominios(res || [])
    } catch (err) {
      console.error('Erro ao carregar domínios', err)
    } finally {
      setLoading(false)
    }
  }

  function abrirModal(d?: Dominio) {
    if (d) {
      setEditing(d)
      reset({
        nome: d.nome,
        porta: d.porta ? String(d.porta) : undefined,
        nginx_server: d.nginx_server || undefined,
        expires_at: d.expires_at ? String(d.expires_at).split('T')[0] : undefined,
      })
    } else {
      setEditing(null)
      reset({})
    }
    setModalOpen(true)
  }

  function fecharModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data: DominioForm) {
    try {
      const payload: any = {
        nome: data.nome,
        nginx_server: data.nginx_server || null,
        expires_at: data.expires_at || null,
        notified: false,
      }
      if (data.porta) payload.porta = Number(data.porta)

      if (editing) {
        await dominioServico.atualizar(editing.id, payload)
      } else {
        await dominioServico.criar(payload)
      }

      await carregar()
      fecharModal()
    } catch (err) {
      console.error('Erro ao salvar domínio', err)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Confirma exclusão do domínio?')) return
    try {
      await dominioServico.excluir(id)
      await carregar()
    } catch (err) {
      console.error('Erro ao excluir domínio', err)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Domínios</h1>
            <p className="text-sm text-light-muted">Gerencie domínios e datas de expiração</p>
          </div>
          <Button onClick={() => abrirModal()}>
            <Plus className="w-4 h-4 mr-2" /> Novo Domínio
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-align-500" />
          </div>
        ) : dominios.length === 0 ? (
          <Card className="text-center py-12">
            <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Nenhum domínio cadastrado</h3>
            <p className="text-gray-500 mt-2">Adicione domínios que você quer controlar</p>
            <Button onClick={() => abrirModal()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Domínio
            </Button>
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Input placeholder="Filtrar por nome ou servidor" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <Button variante="ghost" onClick={() => { setFilter('') }}>Limpar</Button>
            </div>

            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-light-muted border-b border-light-border dark:border-dark-border">
                    <th className="py-3 px-2">Nome</th>
                    <th className="py-3 px-2">Nginx Server</th>
                    <th className="py-3 px-2">Porta</th>
                    <th className="py-3 px-2">Expira</th>
                    <th className="py-3 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dominios.filter(d => {
                    const q = filter.trim().toLowerCase()
                    if (!q) return true
                    return d.nome.toLowerCase().includes(q) || (d.nginx_server || '').toLowerCase().includes(q)
                  }).map((d) => (
                    <tr key={d.id} className="border-b border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover">
                      <td className="py-3 px-2 align-top">
                        <button className="text-left" onClick={() => setSelected(d)}>
                          <div className="font-medium">{d.nome}</div>
                          <div className="text-sm text-light-muted">{d.nginx_server || '—'}</div>
                        </button>
                      </td>
                      <td className="py-3 px-2 align-top">{d.nginx_server || '—'}</td>
                      <td className="py-3 px-2 align-top">{d.porta ?? 'padrão'}</td>
                      <td className="py-3 px-2 align-top">{d.expires_at ? String(d.expires_at).split('T')[0] : '—'}</td>
                      <td className="py-3 px-2 align-top">
                        <div className="flex gap-2">
                          <Button variante="ghost" onClick={() => abrirModal(d)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variante="ghost" onClick={() => excluir(d.id)}>
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

        <Modal isOpen={modalOpen} onClose={fecharModal} titulo={editing ? 'Editar Domínio' : 'Novo Domínio'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Nome" {...register('nome')} erro={errors.nome?.message as any} />
            <Input label="Porta (opcional)" {...register('porta')} />
            <Input label="Nginx server (opcional)" {...register('nginx_server')} />
            <Input label="Expira em" type="date" {...register('expires_at')} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variante="ghost" onClick={fecharModal}>Cancelar</Button>
              <Button type="submit">{editing ? 'Salvar' : 'Adicionar'}</Button>
            </div>
          </form>
        </Modal>

        {/* Details modal */}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} titulo="Detalhes do Domínio">
          {selected && (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-lg">{selected.nome}</h3>
                <p className="text-sm text-light-muted">{selected.nginx_server || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Porta:</strong> {selected.porta ?? 'padrão'}</div>
                <div><strong>Expira:</strong> {selected.expires_at ? String(selected.expires_at).split('T')[0] : '—'}</div>
                <div><strong>Notificado:</strong> {selected.notified ? 'Sim' : 'Não'}</div>
                <div><strong>ID:</strong> {selected.id}</div>
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
