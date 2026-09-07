import { apiClient } from '../lib/axios'
import type { CreateCrewRequest, CrewDto, DutyRole } from '../types/crew'

export const crewService = {
  getByFlight: (flightId: string) =>
    apiClient.get<CrewDto[]>(`/Crew/flight/${flightId}`).then((res) => res.data),

  create: (request: CreateCrewRequest) =>
    apiClient.post<string>('/Crew', request).then((res) => res.data),

  updateDutyRole: (id: string, dutyRole: DutyRole) =>
    apiClient.put<void>(`/Crew/${id}`, { dutyRole }).then((res) => res.data),

  remove: (id: string) => apiClient.delete<void>(`/Crew/${id}`).then((res) => res.data),
}
