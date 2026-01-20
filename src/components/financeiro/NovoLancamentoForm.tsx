"use client"

import React, { useEffect, useState } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Form'
import { Calendar, CreditCard, DollarSign, CheckCircle, XCircle } from 'lucide-react'

type Props = {
  register: any
  control: any
  errors: any
  setValue: any
  projetos: any[]
  onCancel: () => void
  onSubmit: any
  editing: any
}

export default function NovoLancamentoForm({ register, control, errors, setValue, projetos, onCancel, onSubmit, editing }: Props) {
  const [valorDisplay, setValorDisplay] = useState('')

  useEffect(() => {
    // keep display in sync if editing provides value
    // parent sets default values when opening modal
  }, [editing])

  const parseToNumber = (s: string) => {
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : NaN
  }

  const tipo = useWatch({ control, name: 'tipo', defaultValue: 'a_pagar' })

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-lg border border-white/6 dark:border-white/6 rounded-xl p-6 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 space-y-3">
          <label className="text-xs font-semibold text-light-muted">Categoria</label>
          <Input placeholder="Ex: Hospedagem, Domínio, Hora técnica" {...register('categoria' as any)} erro={errors.categoria?.message as any} />

          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-xs font-semibold text-light-muted">Projeto</label>
              <select {...register('projeto_id' as any)} className="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                <option value="">— Nenhum —</option>
                {projetos?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className="w-44">
              <label className="text-xs font-semibold text-light-muted">Vencimento</label>
              <div className="relative">
                <input type="date" className="w-full px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border pr-10" {...register('vencimento' as any)} />
                <Calendar className="absolute right-3 top-3 w-4 h-4 text-light-muted" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div>
            <label className="text-xs font-semibold text-light-muted">Tipo</label>
            <div className="mt-2 flex gap-2 bg-light-surface dark:bg-dark-surface p-1 rounded-lg border border-light-border dark:border-dark-border">
              <button type="button" onClick={() => setValue('tipo','a_pagar')} aria-pressed={tipo==='a_pagar'} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tipo==='a_pagar' ? 'bg-rose-600 text-white shadow-inner' : 'bg-transparent text-light-muted hover:bg-white/3 dark:hover:bg-white/6'}`}>A Pagar</button>
              <button type="button" onClick={() => setValue('tipo','a_receber')} aria-pressed={tipo==='a_receber'} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tipo==='a_receber' ? 'bg-emerald-600 text-white shadow-inner' : 'bg-transparent text-light-muted hover:bg-white/3 dark:hover:bg-white/6'}`}>A Receber</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-light-muted">Valor</label>
            <Controller control={control} name="valor" render={({ field }) => {
              useEffect(() => { setValorDisplay(field.value ? String(field.value).replace('.', ',') : '') }, [field.value])
              return (
                <div className="relative">
                  <div className="absolute left-3 top-3 text-sm text-light-muted">R$</div>
                  <input aria-label="Valor" value={valorDisplay} onChange={(e) => { setValorDisplay(e.target.value); const n = parseToNumber(e.target.value); field.onChange(Number.isFinite(n) ? String(n) : '') }} placeholder="0,00" className="w-full pl-10 pr-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" />
                </div>
              )
            }} />
            {errors.valor && <div className="text-rose-500 text-sm mt-1">{errors.valor?.message as any}</div>}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('pago' as any)} className="hidden" />
              <span className="w-6 h-6 rounded-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center justify-center"><CheckCircle className="w-4 h-4 opacity-60" /></span>
              <span className="text-sm">Marcar como pago</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variante="ghost" onClick={onCancel} className="flex items-center gap-2"><XCircle className="w-4 h-4"/>Cancelar</Button>
            <Button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300"><DollarSign className="w-4 h-4"/>{editing ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
