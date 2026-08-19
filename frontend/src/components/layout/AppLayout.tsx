import { Outlet } from 'react-router-dom'
import { VideoBackdrop } from '../common/VideoBackdrop'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <VideoBackdrop />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
