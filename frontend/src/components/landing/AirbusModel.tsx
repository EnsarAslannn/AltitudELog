import { Suspense, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, useGLTF } from '@react-three/drei'
import { Box3, Vector3, type Group } from 'three'

const MODEL_URL = '/models/airbus.glb'

interface AirbusModelProps {
  /** 0 → hero at rest, 1 → hero fully scrolled past. Driven by the page, not by R3F. */
  scrollProgress: RefObject<number>
  reduceMotion: boolean
}

/** Target size of the aircraft's longest axis, in world units. */
const TARGET_SPAN = 3.6

/*
 * Flight path across the document.
 *
 * The aircraft is no longer pinned to the hero: it drifts for the full length of
 * the page, so its pose is a function of overall scroll progress (0 → 1). Two
 * offset sine waves give a path that comes down and back up more than once
 * without ever repeating exactly — a single linear descent would park it off
 * screen for most of a page this long.
 *
 * These live as module constants rather than JSX props because `useFrame`
 * assigns position and scale outright every frame; props set once at mount are
 * overwritten on the very first tick.
 */
const DRIFT_Y = 1.45
const DRIFT_X = 1.35
const Y_CYCLES = 1.5
const X_CYCLES = 1

function Airbus({ scrollProgress, reduceMotion }: AirbusModelProps) {
  const outerRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)

  // `useGLTF(url, false)` disables the Draco loader. The model is meshopt-encoded
  // and drei's Meshopt decoder is bundled from three-stdlib, but leaving Draco on
  // would attach a loader whose decoder path points at a Google CDN — a network
  // dependency this page has no reason to carry.
  const { scene } = useGLTF(MODEL_URL, false)

  /*
   * Normalise the model to a unit-ish, origin-centred object.
   *
   * The GLB arrives at whatever scale and origin it was exported with; a
   * Sketchfab export carries a root node with its own rotation and scale and
   * usually sits far from the origin. Measuring must therefore happen HERE —
   * while the clone is still unparented, so `setFromObject` reports the model's
   * own bounds — and the correction must be applied by a dedicated wrapper group
   * outside it. The first attempt measured in world space after mounting and
   * wrote the offset onto the model's own `position`, which is expressed in the
   * *rotated* parent frame: the correction came back rotated, threw the aircraft
   * clean out of the frustum, and the canvas rendered zero opaque pixels.
   */
  const { model, fitScale, fitOffset } = useMemo(() => {
    // Cloned so the cached GLTF scene is never mutated: useGLTF memoises by URL,
    // and normalising the original would corrupt it for any later consumer.
    const clone = scene.clone(true)
    const box = new Box3().setFromObject(clone)
    const size = box.getSize(new Vector3())
    const centre = box.getCenter(new Vector3())
    const span = Math.max(size.x, size.y, size.z) || 1
    const s = TARGET_SPAN / span

    return { model: clone, fitScale: s, fitOffset: centre.multiplyScalar(-s) }
  }, [scene])

  useFrame((state, delta) => {
    const outer = outerRef.current
    const spin = spinRef.current
    if (!outer || !spin) return

    const progress = scrollProgress.current ?? 0

    // Scroll drives the path directly (not a spring) so the aircraft tracks the
    // page one-to-one — it should feel attached to the scroll, not chasing it.
    // Cosine on Y so it starts at the top of its arc, level with the hero copy.
    outer.position.y = Math.cos(progress * Math.PI * 2 * Y_CYCLES) * DRIFT_Y
    outer.position.x = Math.sin(progress * Math.PI * 2 * X_CYCLES) * DRIFT_X
    outer.scale.setScalar(0.94 + Math.sin(progress * Math.PI) * 0.12)

    if (reduceMotion) return

    // Yaw only. The torus knot this replaced tumbled on two axes, which reads as
    // abstract sculpture; an aircraft doing the same reads as a crash. Banking it
    // slightly (below) and rotating about the vertical keeps it airborne.
    spin.rotation.y += delta * 0.18

    // Pointer parallax, damped toward the target rather than snapped: a hard
    // follow makes the object feel weightless and jittery on trackpads.
    const targetX = state.pointer.y * 0.12
    const targetY = state.pointer.x * 0.22
    outer.rotation.x += (targetX - outer.rotation.x) * Math.min(1, delta * 2.4)
    outer.rotation.y += (targetY - outer.rotation.y) * Math.min(1, delta * 2.4)
  })

  // The starting position below is only the pose for the first frame; from then
  // on the frame loop above assigns position and scale outright, because the
  // aircraft's whole pose is a function of scroll progress.
  return (
    <group ref={outerRef} position={[0, DRIFT_Y, 0]}>
      <Float
        speed={reduceMotion ? 0 : 1}
        rotationIntensity={reduceMotion ? 0 : 0.15}
        floatIntensity={reduceMotion ? 0 : 0.7}
        floatingRange={[-0.1, 0.1]}
      >
        {/* A touch of pitch and bank, so the silhouette reads as an aircraft in
            flight rather than a plan-view diagram. */}
        <group ref={spinRef} rotation={[0.14, 0, -0.22]}>
          {/* Scale and recentre on one node, so the offset is expressed in the
              same frame as the scale it was derived from. The parent's rotation
              then pivots the already-centred model about its own centre. */}
          <group scale={fitScale} position={fitOffset}>
            <primitive object={model} />
          </group>
        </group>
      </Float>
    </group>
  )
}

export default function AirbusModel({ scrollProgress, reduceMotion }: AirbusModelProps) {
  return (
    <Canvas
      // Capped DPR: this canvas is decorative and sits over a video that is
      // already saturating the compositor — retina-native pixels here buy nothing.
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.4, 7], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // Reduced motion still gets the aircraft, just static — one render, no loop.
      frameloop={reduceMotion ? 'demand' : 'always'}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} />
      <directionalLight position={[-5, -1, -3]} intensity={0.8} color="#8fb4e8" />

      {/*
        The Suspense boundary must live INSIDE the Canvas.
        `useGLTF` suspends while the model downloads. With the only boundary
        outside the Canvas, that suspension unmounts the Canvas itself: React
        swaps the whole subtree for the fallback, three.js disposes the renderer,
        and when the model resolves the remount leaves a dead <canvas> behind —
        `isContextLost() === true`, a 0×0 drawing buffer and nothing on screen.
        Catching it here keeps the renderer alive across the load.
      */}
      <Suspense fallback={null}>
        <Airbus scrollProgress={scrollProgress} reduceMotion={reduceMotion} />
      </Suspense>

      {/*
        Lightformers rather than a preset HDRI: drei's presets are fetched from a
        third-party CDN at runtime, which this app's CSP (`connect-src 'self' https:`)
        would allow but which would also make the hero depend on a network round
        trip to a host we do not control. These ship in the bundle.
      */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} position={[0, 4, 3]} scale={[8, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 0, 2]} scale={[4, 6, 1]} color="#8fb4e8" />
        <Lightformer form="circle" intensity={1.4} position={[4, -2, 2]} scale={4} color="#ffd9b0" />
      </Environment>
    </Canvas>
  )
}

// No `useGLTF.preload` here on purpose. This module is already lazy-imported at
// the exact moment the hero needs it, so preloading saves nothing — and a
// module-scope preload rejects outside React, producing an unhandled rejection
// that the error boundary in SculptureLayer cannot see or recover from.
