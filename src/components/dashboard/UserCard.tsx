import React from 'react'
import { motion } from 'framer-motion'

interface UserSummary { usuario: any; total: number; done: number; pct: number }

export default function UserCard({ summary }: { summary: UserSummary }) {
  const u = summary.usuario
  const pct = Math.max(0, Math.min(100, Number(summary.pct || 0)))

  return (
    <div className="liquid-card block w-full">
      <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl p-5 shadow-md bg-gradient-to-br from-slate-800/50 to-slate-900/50 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">{u.nome}</div>
            <div className="text-xs opacity-80 mt-1">{u.email}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">{(u.nome || 'U').charAt(0)}</div>
        </div>

        <div className="mt-4">
          <div className="text-sm mb-2">{summary.done} de {summary.total} tarefas concluídas</div>
          <div className="w-full bg-white/8 rounded-full h-3 overflow-hidden">
            <div className="bg-white/30 h-3 rounded-full" style={{ width: `${pct}%`, transition: 'width 450ms ease' }} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
