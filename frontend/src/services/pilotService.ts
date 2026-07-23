import { apiClient } from '../lib/axios'
import type { PilotDto, PilotProfileDto } from '../types/pilot'

export const pilotService = {
  getAll: () => apiClient.get<PilotDto[]>('/Pilots').then((res) => res.data),
  getProfile: (id: string) => apiClient.get<PilotProfileDto>(`/Pilots/${id}`).then((res) => res.data),
  updateCertificates: (licenseExpiryDate: string | null, medicalExpiryDate: string | null) =>
    apiClient.put('/Pilots/me/certificates', { licenseExpiryDate, medicalExpiryDate }),
}
