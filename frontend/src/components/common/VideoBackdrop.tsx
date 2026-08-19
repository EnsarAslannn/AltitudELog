import { useReducedMotion } from 'framer-motion'

interface VideoBackdropProps {
  src?: string
  poster?: string
}

export function VideoBackdrop({
  src = '/videos/air-backdrop.mp4',
  poster = '/images/clouds.jpg',
}: VideoBackdropProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#dce8f2]" aria-hidden="true">
      {reduceMotion ? (
        <img src={poster} alt="" className="h-full w-full object-cover" loading="eager" />
      ) : (
        <video
          className="h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
        />
      )}
    </div>
  )
}
