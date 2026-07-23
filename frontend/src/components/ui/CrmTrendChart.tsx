import { useState } from 'react'
import type { MonthlyCrmTrendDto } from '../../types/stats'
import type { SeverityLevel } from '../../types/crmReport'

interface CrmTrendChartProps {
  data: MonthlyCrmTrendDto[]
}

const severityOrder: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

// Fixed status ramp (good/warning/serious/critical) — reserved colors, never
// reused for arbitrary series, matched 1:1 to the severity levels they name.
const severityColor: Record<SeverityLevel, string> = {
  Low: '#0ca30c',
  Medium: '#fab219',
  High: '#ec835a',
  Critical: '#d03b3b',
}

const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const PADDING_TOP = 24
const PADDING_BOTTOM = 28
const PADDING_X = 16

function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height)
  if (height <= 0) return ''
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
}

export function CrmTrendChart({ data }: CrmTrendChartProps) {
  const [hovered, setHovered] = useState<{ monthIndex: number; severity: SeverityLevel; x: number; y: number } | null>(
    null,
  )

  const maxCount = Math.max(1, ...data.flatMap((m) => severityOrder.map((s) => m.countsBySeverity[s] ?? 0)))
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const plotWidth = CHART_WIDTH - PADDING_X * 2
  const clusterWidth = plotWidth / Math.max(1, data.length)
  const barGap = 2
  const barWidth = (clusterWidth - barGap * (severityOrder.length + 1)) / severityOrder.length

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" role="img" aria-label="CRM raporları — son 6 ay ciddiyet trendi">
        <line
          x1={PADDING_X}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_X}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#c3c2b7"
          strokeWidth={1}
        />

        {data.map((month, monthIndex) => {
          const clusterX = PADDING_X + monthIndex * clusterWidth

          return (
            <g key={`${month.year}-${month.month}`}>
              {severityOrder.map((severity, severityIndex) => {
                const count = month.countsBySeverity[severity] ?? 0
                const barHeight = (count / maxCount) * plotHeight
                const barX = clusterX + barGap + severityIndex * (barWidth + barGap)
                const barY = CHART_HEIGHT - PADDING_BOTTOM - barHeight
                const isHovered =
                  hovered?.monthIndex === monthIndex && hovered.severity === severity

                return (
                  <g key={severity}>
                    <path
                      d={roundedTopRectPath(barX, barY, barWidth, barHeight, 3)}
                      fill={severityColor[severity]}
                      opacity={isHovered ? 1 : 0.9}
                      onMouseEnter={() =>
                        setHovered({ monthIndex, severity, x: barX + barWidth / 2, y: barY })
                      }
                      onMouseLeave={() => setHovered(null)}
                    />
                    {count > 0 && (
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#52514e"
                        className="pointer-events-none select-none"
                      >
                        {count}
                      </text>
                    )}
                  </g>
                )
              })}
              <text
                x={clusterX + clusterWidth / 2}
                y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#898781"
              >
                {monthLabels[month.month - 1]}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(hovered.x / CHART_WIDTH) * 100}%`,
            top: `${(hovered.y / CHART_HEIGHT) * 100}%`,
          }}
        >
          <span className="font-medium text-[#0b1220]">{hovered.severity}</span>
          <span className="ml-1.5 text-slate-500">
            {data[hovered.monthIndex].countsBySeverity[hovered.severity] ?? 0} rapor
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
        {severityOrder.map((severity) => (
          <span key={severity} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: severityColor[severity] }}
              aria-hidden
            />
            {severity}
          </span>
        ))}
      </div>
    </div>
  )
}
