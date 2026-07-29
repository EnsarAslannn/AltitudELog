import { apiClient } from '../lib/axios'
import type {
  AuthResponseDto,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types/auth'

export const authService = {
  register: (request: RegisterRequest) =>
    apiClient.post<string>('/Auth/register', request).then((res) => res.data),

  login: (request: LoginRequest) =>
    apiClient.post<AuthResponseDto>('/Auth/login', request).then((res) => res.data),

  forgotPassword: (request: ForgotPasswordRequest) => apiClient.post('/Auth/forgot-password', request),

  resetPassword: (request: ResetPasswordRequest) => apiClient.post('/Auth/reset-password', request),

  // No `refresh` here on purpose. Refreshing goes through refreshClient in lib/axios.ts, which
  // deliberately bypasses apiClient's interceptors — a refresh issued through apiClient would
  // recurse back into the 401 handler that triggered it.

  logout: () => apiClient.post('/Auth/logout'),
}
