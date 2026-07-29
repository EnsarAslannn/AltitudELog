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
