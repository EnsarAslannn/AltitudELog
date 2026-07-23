import { apiClient } from '../lib/axios'
import type { CreateFlightRequest, FlightDto, UpdateFlightRequest } from '../types/flight'

export const flightService = {
  getAll: () => apiClient.get<FlightDto[]>('/Flights').then((res) => res.data),

  getById: (id: string) => apiClient.get<FlightDto>(`/Flights/${id}`).then((res) => res.data),

  create: (request: CreateFlightRequest) =>
    apiClient.post<string>('/Flights', request).then((res) => res.data),

  update: (id: string, request: UpdateFlightRequest) => apiClient.put(`/Flights/${id}`, request),

  cancel: (id: string) => apiClient.post(`/Flights/${id}/cancel`),
}
