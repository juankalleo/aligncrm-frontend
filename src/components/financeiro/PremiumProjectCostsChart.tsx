import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'

export default function PremiumProjectCostsChart({ data, formatCurrency }: { data: Array<{ name: string, value: number }>, formatCurrency: (v: number) => string }) {
  const tooltipFormatter = (value: number) => formatCurrency(Number(value || 0))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
          <Tooltip formatter={tooltipFormatter} contentStyle={{ background: '#0b1220', borderRadius: 8, border: 'none', color: '#fff' }} />
          <Bar dataKey="value" radius={[6,6,0,0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
