import { useEffect, useId, useState } from 'react'
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { aircraftTypes } from '../../data/aircraftTypes'
import { FLIGHT_SORT_FIELDS, type FlightQuery, type FlightSortField } from '../../types/flight'

const SEARCH_DEBOUNCE_MS = 350

const sortLabel: Record<FlightSortField, string> = {
  Date: 'Tarih',
  FlightTime: 'Uçuş Süresi',
  OriginICAO: 'Kalkış',
  DestinationICAO: 'Varış',
  AircraftType: 'Uçak Tipi',
}

interface FlightFilterBarProps {
  query: FlightQuery
  onChange: (changes: Partial<FlightQuery>) => void
  onClear: () => void
  activeFilterCount: number
  resultCount: number
  isLoading: boolean
}

export function FlightFilterBar({
  query,
  onChange,
  onClear,
  activeFilterCount,
  resultCount,
  isLoading,
}: FlightFilterBarProps) {
  const panelId = useId()
  // Open by default once something is filtered, so a shared URL doesn't look like an empty list
  // with no explanation.
  const [isOpen, setIsOpen] = useState(activeFilterCount > 0)

  // Local mirror of the search box: typing updates it immediately (so the field stays
  // responsive) and only lands in the URL once typing pauses, instead of firing a request and a
  // history entry per keystroke.
  const [searchDraft, setSearchDraft] = useState(query.search ?? '')

  useEffect(() => {
    setSearchDraft(query.search ?? '')
  }, [query.search])

  useEffect(() => {
    const current = query.search ?? ''
    if (searchDraft === current) return

    const timer = setTimeout(() => onChange({ search: searchDraft }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchDraft, query.search, onChange])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Ara"
            name="search"
            type="search"
            icon={Search}
            placeholder="Havaalanı veya uçak tipi (örn. LTFM, A320)"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((open) => !open)}
          >
            Filtreler
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-on-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" icon={X} onClick={onClear}>
              Temizle
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div id={panelId} className="flex flex-col gap-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Başlangıç Tarihi"
              name="dateFrom"
              type="date"
              max={query.dateTo || today}
              value={query.dateFrom ?? ''}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
            />
            <Input
              label="Bitiş Tarihi"
              name="dateTo"
              type="date"
              min={query.dateFrom || undefined}
              max={today}
              value={query.dateTo ?? ''}
              onChange={(e) => onChange({ dateTo: e.target.value })}
            />
            <Select
              label="Uçak Tipi"
              name="aircraftType"
              value={query.aircraftType ?? ''}
              onChange={(e) => onChange({ aircraftType: e.target.value })}
            >
              <option value="">Tümü</option>
              {aircraftTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.code} — {type.label}
                </option>
              ))}
            </Select>
            <Select
              label="Durum"
              name="isCancelled"
              value={query.isCancelled === undefined ? '' : String(query.isCancelled)}
              onChange={(e) =>
                onChange({ isCancelled: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
            >
              <option value="">Tümü</option>
              <option value="false">Aktif</option>
              <option value="true">İptal Edilmiş</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Kalkış (ICAO)"
              name="origin"
              maxLength={4}
              placeholder="LTFM"
              value={query.originICAO ?? ''}
              onChange={(e) => onChange({ originICAO: e.target.value.toUpperCase() })}
            />
            <Input
              label="Varış (ICAO)"
              name="destination"
              maxLength={4}
              placeholder="EGLL"
              value={query.destinationICAO ?? ''}
              onChange={(e) => onChange({ destinationICAO: e.target.value.toUpperCase() })}
            />
            <Select
              label="Sırala"
              name="sortBy"
              value={query.sortBy ?? 'Date'}
              onChange={(e) => onChange({ sortBy: e.target.value as FlightSortField })}
            >
              {FLIGHT_SORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {sortLabel[field]}
                </option>
              ))}
            </Select>
            <div className="flex flex-col justify-end">
              <Button
                variant="secondary"
                icon={query.sortDescending === false ? ArrowUpNarrowWide : ArrowDownNarrowWide}
                onClick={() => onChange({ sortDescending: !(query.sortDescending ?? true) })}
              >
                {query.sortDescending === false ? 'Artan' : 'Azalan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* aria-live so screen-reader users hear the result count change after a filter edit —
          the list itself updating silently gives them no feedback that anything happened. */}
      <p aria-live="polite" className="text-xs text-on-surface-variant">
        {isLoading
          ? 'Uçuşlar filtreleniyor…'
          : activeFilterCount > 0
            ? `${resultCount} uçuş bulundu.`
            : `Toplam ${resultCount} uçuş.`}
      </p>
    </Card>
  )
}
