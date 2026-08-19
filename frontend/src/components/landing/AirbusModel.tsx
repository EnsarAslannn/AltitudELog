import { Suspense, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, useGLTF } from '@react-three/drei'
import { Box3, Color, Mesh, Vector3, type Group, type Material } from 'three'

const MODEL_URL = '/models/airbus.glb'

interface AirbusModelProps {
  /** 0 → top of the document, 1 → fully scrolled. Driven by the page, not by R3F. */
  scrollProgress: RefObject<number>
  reduceMotion: boolean
}

/** Target size of the aircraft's longest axis, in world units. */
const TARGET_SPAN = 3.6

/*
 * Flight path across the document.
 *
 * The aircraft drifts for the full length of the page, so its pose is a function
 * of overall scroll progress (0 → 1). Well under one full cycle on each axis: at
 * the 1.5 vertical cycles this ran at before, a normal flick of the wheel threw
 * the model through most of an arc at once, which read as a jump rather than as
 * flight. One slow descent and return over the whole page is the entire budget.
 *
 * These live as module constants rather than JSX props because `useFrame`
 * assigns position and scale outright every frame; props set once at mount are
 * overwritten on the very first tick.
 */
const DRIFT_Y = 0.95
const Y_CYCLES = 0.6

/*
 * Vertical bias. At rest the model used to sit at y=+1.45, roughly a fifth of the
 * way down the viewport — floating near the top edge, disconnected from the hero
 * copy far below it. Together with the reduced DRIFT_Y this puts its resting pose
 * at y≈+0.60, just above the headline rather than above the whole screen.
 */
const Y_OFFSET = -0.35

/*
 * Horizontal path: lean right, then cross to the left.
 *
 * This was a sine, which meant the aircraft spent most of the scroll travelling
 * rightward and ended the page pinned to the right margin. The shape wanted here
 * is different: it starts to the right of the headline, leans a little further
 * right as the reader begins to scroll, and from there drifts steadily left for
 * the rest of the page.
 *
 *   x(p) = X_START + RIGHT_BUMP·sin(π · min(1, p / 2·P_PEAK)) − LEFT_TRAVEL·p
 *
 * The sine term is a single hump: it reaches RIGHT_BUMP at p = P_PEAK and is back
 * to zero by p = 2·P_PEAK, after which `min` pins it there so it never returns.
 * The linear term is the crossing, and it is what dominates once the hump is
 * spent. Both are continuous at the join, so there is no kink to see.
 *
 * Nothing here is time-based — x is a pure function of scroll position — so
 * scrolling back up retraces the same path in reverse for free, which is the
 * mirrored return the design calls for.
 */
const X_START = 1.45
const RIGHT_BUMP = 0.55
const P_PEAK = 0.12
const LEFT_TRAVEL = 2.9

function pathX(progress: number): number {
  const bump = Math.sin(Math.PI * Math.min(1, progress / (2 * P_PEAK)))
  return X_START + RIGHT_BUMP * bump - LEFT_TRAVEL * progress
}

/**
 * How fast the model catches up to the scrollbar, in e-folds per second. At 0.65
 * it covers about 63% of the remaining distance every 1.5 seconds — heavy enough
 * that the aircraft visibly trails the page rather than tracking it.
 *
 * The path used to be read straight off `scrollProgress`, which welds the model
 * 1:1 to the wheel: it moved exactly as abruptly as the reader scrolled. Easing
 * toward the scroll position instead gives the aircraft mass — it leads out of a
 * flick and settles afterwards, and a fast scroll no longer snaps it across the
 * viewport. Frame-rate independent, so a 144Hz display gets the same arc as 60Hz.
 */
const SCROLL_FOLLOW = 0.65

/** Yaw rate about the model's own vertical axis, in radians per second. */
const YAW_SPEED = 0.2

/** How far the white airframe is pulled toward a cool steel. See `tintMaterials`. */
const TINT_STRENGTH = 0.34
const TINT_COLOR = new Color('#6f88a6')

/*
 * The GLB's airframe is near-white, and the page it now flies over is an
 * unmodified daylight sky whose clouds are also near-white — so at the model's
 * own colours it simply disappears for most of the scroll. Pulling every material
 * toward a cool steel keeps the silhouette readable against cloud while staying a
 * plausible livery, and the specular response is left alone so the sun still
 * catches the upper surfaces.
 *
 * Materials are cloned first: `scene.clone(true)` copies the node graph but keeps
 * material references shared with the cached GLTF, so tinting in place would
 * recolour the original for every later consumer of that URL.
 */
function tintMaterials(root: Group): void {
  const seen = new Map<Material, Material>()

  root.traverse((node) => {
    if (!(node instanceof Mesh)) return

    const swap = (material: Material): Material => {
      const cached = seen.get(material)
      if (cached) return cached

      const copy = material.clone()
      const colored = copy as Material & { color?: Color }
      if (colored.color) colored.color.lerp(TINT_COLOR, TINT_STRENGTH)
      seen.set(material, copy)
      return copy
    }

    node.material = Array.isArray(node.material)
      ? node.material.map(swap)
      : swap(node.material)
  })
}

function Airbus({ scrollProgress, reduceMotion }: AirbusModelProps) {
  const outerRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const smoothProgress = useRef(0)

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
    tintMaterials(clone)

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

    // Ease toward the scrollbar rather than tracking it. `1 - exp(-k·dt)` is the
    // frame-rate-independent form: the same fraction of the remaining distance is
    // covered per unit of time regardless of how often frames arrive.
    const target = scrollProgress.current ?? 0
    smoothProgress.current += (target - smoothProgress.current) * (1 - Math.exp(-delta * SCROLL_FOLLOW))
    const progress = smoothProgress.current

    // Cosine on Y so it starts at the top of its arc, level with the hero copy.
    outer.position.y = Y_OFFSET + Math.cos(progress * Math.PI * 2 * Y_CYCLES) * DRIFT_Y
    outer.position.x = pathX(progress)
    outer.scale.setScalar(0.94 + Math.sin(progress * Math.PI) * 0.12)

    if (reduceMotion) return

    // Yaw only. The torus knot this replaced tumbled on two axes, which reads as
    // abstract sculpture; an aircraft doing the same reads as a crash. Banking it
    // slightly (below) and rotating about the vertical keeps it airborne.
    //
    // 0.2 rad/s is a full turn every ~31 seconds. This ran at 0.05 for a while,
    // which is one turn every two minutes — slow enough that a reader passing
    // through the page never saw it move at all, so the model read as a still
    // image rather than as something in flight.
    spin.rotation.y += delta * YAW_SPEED

    // Pointer parallax, damped toward the target rather than snapped: a hard
    // follow makes the object feel weightless and jittery on trackpads.
    const targetX = state.pointer.y * 0.12
    const targetY = state.pointer.x * 0.22
    outer.rotation.x += (targetX - outer.rotation.x) * Math.min(1, delta * 1.2)
    outer.rotation.y += (targetY - outer.rotation.y) * Math.min(1, delta * 1.2)
  })

  // The starting position below is only the pose for the first frame; from then
  // on the frame loop above assigns position and scale outright, because the
  // aircraft's whole pose is a function of scroll progress.
  return (
    <group ref={outerRef} position={[X_START, Y_OFFSET + DRIFT_Y, 0]}>
      <Float
        speed={reduceMotion ? 0 : 0.5}
        rotationIntensity={reduceMotion ? 0 : 0.12}
        floatIntensity={reduceMotion ? 0 : 0.5}
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
      {/*
        Lit for a bright ground rather than a dark one. The fill was carrying most
        of the exposure when the page behind was a black-washed hero; on open sky
        that flattens the model into the clouds, so the key does the work and the
        ambient only keeps the shadow side from going to silhouette.
      */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 4]} intensity={2.6} />
      <directionalLight position={[-5, -1, -3]} intensity={0.5} color="#8fb4e8" />

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
