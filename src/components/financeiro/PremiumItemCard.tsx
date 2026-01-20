import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Edit, Trash2 } from 'lucide-react'

export default function PremiumItemCard({ item, onEdit, onDelete, projetos, formatCurrency }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -4 }} className="group rounded-xl p-4 shadow-lg bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{item.descricao || '—'}</div>
            <div className="text-xs opacity-70">{item.categoria} • {(item as any).projeto_id ? (projetos.find((p:any)=>p.id===(item as any).projeto_id)?.nome || (item as any).projeto_id) : 'Sem projeto'}</div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-sm font-semibold ${item.tipo === 'a_receber' ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(Number(item.valor || 0))}</div>
          <div className="text-xs opacity-60">{(item as any).vencimento ? String((item as any).vencimento).split('T')[0] : (item.data ? String(item.data).split('T')[0] : '—')}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className={`text-xs ${item.pago ? 'text-emerald-200' : 'text-amber-300'}`}>{item.pago ? 'Pago' : 'Pendente'}</div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(item)} className="p-2 rounded hover:bg-white/5"><Edit className="w-4 h-4 text-white"/></button>
          <button type="button" onClick={() => onDelete(item)} className="p-2 rounded hover:bg-white/5"><Trash2 className="w-4 h-4 text-white"/></button>
        </div>
      </div>
    </motion.div>
  )
}
