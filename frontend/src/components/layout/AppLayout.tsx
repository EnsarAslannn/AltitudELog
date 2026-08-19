import { Outlet } from 'react-router-dom'
import { VideoBackdrop } from '../common/VideoBackdrop'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

/**
 * The signed-in shell.
 *
 * It runs on the same Air 1 clip as the landing page — one fixed layer for the
 * whole route, shown as shot. The chrome above it (bar, footer) and every panel
 * inside a page are translucent to varying degrees, so the sky is present in the
 * gutters and between cards rather than being boxed out by an opaque page fill.
 * Dense data surfaces stay near-opaque: legibility of a flight list beats another
 * glimpse of cloud.
 */
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
