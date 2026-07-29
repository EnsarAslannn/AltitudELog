export interface FlightDto {
  id: string
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
  metarInfo: string | null
  isCancelled: boolean
}

export interface FlightsPageResult {
  items: FlightDto[]
  /** Every row `items` pages through, cancelled flights included — the pagination denominator. */
  totalCount: number
  pageNumber: number
  pageSize: number
  /** Non-cancelled flights only; this is the figure the dashboard tile shows. */
  activeCount: number
  thisMonthCount: number
  distinctAircraftTypeCount: number
}

export const FLIGHT_SORT_FIELDS = [
  'Date',
  'FlightTime',
  'OriginICAO',
  'DestinationICAO',
  'AircraftType',
] as const

export type FlightSortField = (typeof FLIGHT_SORT_FIELDS)[number]

/** Mirrors GetFlightsQuery. Every field is optional; omitting one means "don't filter on it". */
export interface FlightQuery {
  pageNumber?: number
  pageSize?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  originICAO?: string
  destinationICAO?: string
  aircraftType?: string
  isCancelled?: boolean
  sortBy?: FlightSortField
  sortDescending?: boolean
}

export interface CreateFlightRequest {
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
}

export interface UpdateFlightRequest {
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
}
