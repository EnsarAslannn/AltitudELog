import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { setLoginRedirect } from './lib/axios'

function App() {
  useEffect(() => {
    setLoginRedirect(() => router.navigate('/login'))
  }, [])

  // Outside RouterProvider on purpose: a crash thrown while the router itself renders — a bad
  // route element, a loader blowing up — has to be caught above it, or nothing catches it.
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App
