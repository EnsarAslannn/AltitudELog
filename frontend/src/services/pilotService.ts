import { apiClient } from '../lib/axios'
import type { PilotDto, PilotProfileDto } from '../types/pilot'

export const pilotService = {
  getAll: () => apiClient.get<PilotDto[]>('/Pilots').then((res) => res.data),
  getProfile: (id: string) => apiClient.get<PilotProfileDto>(`/Pilots/${id}`).then((res) => res.data),

  exportLogbook: (id: string, format: 'csv' | 'pdf') =>
    apiClient
      .get<Blob>(`/Pilots/${id}/logbook`, { params: { format }, responseType: 'blob' })
      .then((res) => res.data),
}
