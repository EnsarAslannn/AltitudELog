export interface FlightDto {
  id: string
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
  metarInfo: string | null
}

export interface CreateFlightRequest {
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
  metarInfo: string | null
}
