import { apiClient } from '../lib/axios'
import type {
  CreateFlightRequest,
  FlightDto,
  FlightQuery,
  FlightsPageResult,
  UpdateFlightRequest,
} from '../types/flight'

export const flightService = {
  getAll: (query: FlightQuery = {}) => {
    const params = Object.fromEntries(
      Object.entries({ pageNumber: 1, pageSize: 20, ...query }).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    )

    return apiClient.get<FlightsPageResult>('/Flights', { params }).then((res) => res.data)
  },

  getById: (id: string) => apiClient.get<FlightDto>(`/Flights/${id}`).then((res) => res.data),

  create: (request: CreateFlightRequest) =>
    apiClient.post<string>('/Flights', request).then((res) => res.data),

  update: (id: string, request: UpdateFlightRequest) => apiClient.put(`/Flights/${id}`, request),

  cancel: (id: string) => apiClient.post(`/Flights/${id}/cancel`),
}
