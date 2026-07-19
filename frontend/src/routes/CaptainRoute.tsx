import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function CaptainRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const rank = useAuthStore((state) => state.rank)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (rank !== 'Captain') {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
