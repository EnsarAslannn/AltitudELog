import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { CaptainRoute } from './routes/CaptainRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { FlightDetailPage } from './pages/FlightDetailPage'
import { PilotProfilePage } from './pages/PilotProfilePage'
import { CreateFlightPage } from './pages/CreateFlightPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
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
            children: [{ path: '/flights/new', element: <CreateFlightPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
