import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number | string
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00205b]/6 text-[#00205b]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="data text-3xl font-semibold leading-none tabular-nums text-[#0b1220]">{value}</p>
        <p className="eyebrow mt-2 text-[10px] text-slate-500">{label}</p>
      </div>
    </Card>
  )
}
