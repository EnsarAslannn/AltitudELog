import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { CaptainRoute } from './routes/CaptainRoute'
import { CommandRoute } from './routes/CommandRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { FlightDetailPage } from './pages/FlightDetailPage'
import { PilotProfilePage } from './pages/PilotProfilePage'
import { AdminStatsPage } from './pages/AdminStatsPage'
import { CreateFlightPage } from './pages/CreateFlightPage'
import { EditFlightPage } from './pages/EditFlightPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/flights/:id', element: <FlightDetailPage /> },
          { path: '/pilots/:id', element: <PilotProfilePage /> },
          { path: '/unauthorized', element: <UnauthorizedPage /> },
          {
            element: <CaptainRoute />,
            children: [
              { path: '/flights/new', element: <CreateFlightPage /> },
              { path: '/flights/:id/edit', element: <EditFlightPage /> },
            ],
          },
          {
            element: <CommandRoute />,
            children: [{ path: '/admin/stats', element: <AdminStatsPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
