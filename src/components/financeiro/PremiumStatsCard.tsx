import React from 'react'
import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { Button } from '@/components/ui/Form'

export default function PremiumStatsCard({
  balanceOptions,
  balanceSeries,
  stackedOptions,
  stackedSeries,
  categories,
  exportCsv,
  items,
}: any) {
  return (
    <div className="rounded-3xl p-6 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold mt-1">Saldo Mensal & Fluxo por Categoria</h3>
          <div className="text-xs opacity-70 mt-1">Visual interativa com destaque por categoria</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 items-center">
            {categories.map((c: string) => (
              <div key={c} className="flex items-center gap-2 text-sm"><span style={{width:12,height:12,background: (c && c.length ? undefined : '#999'), display:'inline-block',borderRadius:3}}/> {c}</div>
            ))}
          </div>
          <Button variante="secondary" onClick={() => exportCsv(items)}>Exportar CSV</Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-black/20 p-3">
          <Chart options={balanceOptions} series={balanceSeries} type="area" height={320} />
        </div>
        <div className="rounded-2xl bg-black/10 p-3">
          <Chart options={stackedOptions} series={stackedSeries} type="bar" height={320} />
        </div>
      </div>
    </div>
  )
}
