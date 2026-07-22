import { apiClient } from '../lib/axios'
import type { StatsDto } from '../types/stats'

export const statsService = {
  getStats: () => apiClient.get<StatsDto>('/Stats').then((res) => res.data),
}
