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
}
