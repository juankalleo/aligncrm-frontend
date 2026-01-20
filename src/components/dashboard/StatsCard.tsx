import React from 'react'
import { motion } from 'framer-motion'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export default function StatsCard({ title, value, subtitle, icon, className = '' }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-4 bg-gradient-to-br from-slate-800/40 to-slate-900/40 text-white shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
        {icon && <div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center text-white">{icon}</div>}
      </div>
    </motion.div>
  )
}
