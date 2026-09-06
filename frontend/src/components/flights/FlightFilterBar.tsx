import { useEffect, useId, useState } from 'react'
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { aircraftTypes } from '../../data/aircraftTypes'
import { useT, type TranslationKey } from '../../i18n'
import { FLIGHT_SORT_FIELDS, type FlightQuery, type FlightSortField } from '../../types/flight'

const SEARCH_DEBOUNCE_MS = 350

const sortLabelKey: Record<FlightSortField, TranslationKey> = {
  Date: 'filters.sort.date',
  FlightTime: 'filters.sort.flightTime',
  OriginICAO: 'filters.sort.origin',
  DestinationICAO: 'filters.sort.destination',
  AircraftType: 'filters.sort.aircraftType',
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
  const [isOpen, setIsOpen] = useState(activeFilterCount > 0)
  const t = useT()

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
            label={t('filters.search')}
            name="search"
            type="search"
            icon={Search}
            placeholder={t('filters.searchPlaceholder')}
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
            {t('filters.toggle')}
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-on-primary">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" icon={X} onClick={onClear}>
              {t('filters.clear')}
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div id={panelId} className="flex flex-col gap-4 border-t border-outline-variant pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={t('filters.dateFrom')}
              name="dateFrom"
              type="date"
              max={query.dateTo || today}
              value={query.dateFrom ?? ''}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
            />
            <Input
              label={t('filters.dateTo')}
              name="dateTo"
              type="date"
              min={query.dateFrom || undefined}
              max={today}
              value={query.dateTo ?? ''}
              onChange={(e) => onChange({ dateTo: e.target.value })}
            />
            <Select
              label={t('filters.aircraftType')}
              name="aircraftType"
              value={query.aircraftType ?? ''}
              onChange={(e) => onChange({ aircraftType: e.target.value })}
            >
              <option value="">{t('common.all')}</option>
              {aircraftTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.code} — {type.label}
                </option>
              ))}
            </Select>
            <Select
              label={t('filters.status')}
              name="isCancelled"
              value={query.isCancelled === undefined ? '' : String(query.isCancelled)}
              onChange={(e) =>
                onChange({ isCancelled: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
            >
              <option value="">{t('common.all')}</option>
              <option value="false">{t('filters.status.active')}</option>
              <option value="true">{t('filters.status.cancelled')}</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={t('filters.origin')}
              name="origin"
              maxLength={4}
              placeholder="LTFM"
              value={query.originICAO ?? ''}
              onChange={(e) => onChange({ originICAO: e.target.value.toUpperCase() })}
            />
            <Input
              label={t('filters.destination')}
              name="destination"
              maxLength={4}
              placeholder="EGLL"
              value={query.destinationICAO ?? ''}
              onChange={(e) => onChange({ destinationICAO: e.target.value.toUpperCase() })}
            />
            <Select
              label={t('filters.sort')}
              name="sortBy"
              value={query.sortBy ?? 'Date'}
              onChange={(e) => onChange({ sortBy: e.target.value as FlightSortField })}
            >
              {FLIGHT_SORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {t(sortLabelKey[field])}
                </option>
              ))}
            </Select>
            <div className="flex flex-col justify-end">
              <Button
                variant="secondary"
                icon={query.sortDescending === false ? ArrowUpNarrowWide : ArrowDownNarrowWide}
                onClick={() => onChange({ sortDescending: !(query.sortDescending ?? true) })}
              >
                {query.sortDescending === false ? t('filters.sortAscending') : t('filters.sortDescending')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <p aria-live="polite" className="text-xs text-on-surface-variant">
        {isLoading
          ? t('filters.filtering')
          : activeFilterCount > 0
            ? t('filters.matchCount', { count: resultCount })
            : t('filters.totalCount', { count: resultCount })}
      </p>
    </Card>
  )
}
