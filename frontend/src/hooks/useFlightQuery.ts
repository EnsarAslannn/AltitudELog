import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FLIGHT_SORT_FIELDS, type FlightQuery, type FlightSortField } from '../types/flight'

export const DEFAULT_PAGE_SIZE = 20

const DEFAULT_SORT: FlightSortField = 'Date'

function isSortField(value: string | null): value is FlightSortField {
  return value !== null && (FLIGHT_SORT_FIELDS as readonly string[]).includes(value)
}

export function useFlightQuery() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<FlightQuery>(() => {
    const isCancelled = searchParams.get('isCancelled')
    const sortBy = searchParams.get('sortBy')
    const pageNumber = Number(searchParams.get('page'))

    return {
      pageNumber: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
      pageSize: DEFAULT_PAGE_SIZE,
      search: searchParams.get('search') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      originICAO: searchParams.get('origin') ?? undefined,
      destinationICAO: searchParams.get('destination') ?? undefined,
      aircraftType: searchParams.get('aircraftType') ?? undefined,
      isCancelled: isCancelled === null ? undefined : isCancelled === 'true',
      sortBy: isSortField(sortBy) ? sortBy : DEFAULT_SORT,
      sortDescending: searchParams.get('sortDir') !== 'asc',
    }
  }, [searchParams])

  const updateQuery = useCallback(
    (changes: Partial<FlightQuery>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)

          const paramName: Record<string, string> = {
            pageNumber: 'page',
            originICAO: 'origin',
            destinationICAO: 'destination',
            sortDescending: 'sortDir',
          }

          for (const [key, value] of Object.entries(changes)) {
            const name = paramName[key] ?? key

            if (key === 'sortDescending') {
              if (value === false) next.set('sortDir', 'asc')
              else next.delete('sortDir')
              continue
            }

            if (value === undefined || value === null || value === '') next.delete(name)
            else next.set(name, String(value))
          }

          if (!('pageNumber' in changes)) next.delete('page')
          if (next.get('page') === '1') next.delete('page')
          if (next.get('sortBy') === DEFAULT_SORT) next.delete('sortBy')

          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const activeFilterCount = useMemo(
    () =>
      (['search', 'dateFrom', 'dateTo', 'origin', 'destination', 'aircraftType', 'isCancelled'] as const).filter(
        (name) => searchParams.get(name),
      ).length,
    [searchParams],
  )

  return { query, updateQuery, clearFilters, activeFilterCount }
}
