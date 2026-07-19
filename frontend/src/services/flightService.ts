import { apiClient } from '../lib/axios'
import type { CreateFlightRequest, FlightDto } from '../types/flight'

export const flightService = {
  getAll: () => apiClient.get<FlightDto[]>('/Flights').then((res) => res.data),

  create: (request: CreateFlightRequest) =>
    apiClient.post<string>('/Flights', request).then((res) => res.data),
}
