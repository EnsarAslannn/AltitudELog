import { apiClient } from '../lib/axios'
import type { CreateCrewRequest, CrewDto } from '../types/crew'

export const crewService = {
  getByFlight: (flightId: string) =>
    apiClient.get<CrewDto[]>(`/Crew/flight/${flightId}`).then((res) => res.data),

  create: (request: CreateCrewRequest) =>
    apiClient.post<string>('/Crew', request).then((res) => res.data),
}
