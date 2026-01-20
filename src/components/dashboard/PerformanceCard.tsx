import React from 'react'
import { motion } from 'framer-motion'

export default function PerformanceCard({ score = 0, created = 0, closed = 0 }: { score?: number, created?: number, closed?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-lime-400 to-green-400 text-black dark:text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Desempenho</div>
          <div className="text-xs opacity-80">Visão geral de tarefas</div>
        </div>
        <div className="text-2xl font-bold">{score}</div>
      </div>

      <div className="mt-4">
        <div className="bg-white/20 dark:bg-white/10 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Tarefas criadas</div>
            <div className="text-lg font-bold">{created}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Tarefas finalizadas</div>
            <div className="text-lg font-bold">{closed}</div>
          </div>
        </div>
        <div className="h-3 bg-black/10 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
          <div style={{width: `${score}%`}} className="h-full bg-black/70 dark:bg-white/70" />
        </div>
      </div>
    </motion.div>
  )
}
