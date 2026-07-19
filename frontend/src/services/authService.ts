import { apiClient } from '../lib/axios'
import type { AuthResponseDto, LoginRequest, RegisterRequest } from '../types/auth'

export const authService = {
  register: (request: RegisterRequest) =>
    apiClient.post<string>('/Auth/register', request).then((res) => res.data),

  login: (request: LoginRequest) =>
    apiClient.post<AuthResponseDto>('/Auth/login', request).then((res) => res.data),
}
