import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { setLoginRedirect } from './lib/axios'

function App() {
  useEffect(() => {
    setLoginRedirect(() => router.navigate('/login'))
  }, [])

  return <RouterProvider router={router} />
}

export default App
