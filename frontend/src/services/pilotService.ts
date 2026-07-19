import { apiClient } from '../lib/axios'
import type { PilotDto } from '../types/pilot'

export const pilotService = {
  getAll: () => apiClient.get<PilotDto[]>('/Pilots').then((res) => res.data),
}
