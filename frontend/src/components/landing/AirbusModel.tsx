import { Suspense, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, useGLTF } from '@react-three/drei'
import { Box3, Color, Mesh, Vector3, type Group, type Material } from 'three'

const MODEL_URL = '/models/airbus.glb'

interface AirbusModelProps {
  scrollProgress: RefObject<number>
  reduceMotion: boolean
}

const TARGET_SPAN = 3.6

const DRIFT_Y = 0.95
const Y_CYCLES = 0.6

const Y_OFFSET = -0.35

const X_START = 1.45
const RIGHT_BUMP = 0.55
const P_PEAK = 0.12
const LEFT_TRAVEL = 2.9

function pathX(progress: number): number {
  const bump = Math.sin(Math.PI * Math.min(1, progress / (2 * P_PEAK)))
  return X_START + RIGHT_BUMP * bump - LEFT_TRAVEL * progress
}

const SCROLL_FOLLOW = 0.65

const YAW_SPEED = 0.2

const TINT_STRENGTH = 0.34
const TINT_COLOR = new Color('#6f88a6')

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

  const { scene } = useGLTF(MODEL_URL, false)

  const { model, fitScale, fitOffset } = useMemo(() => {
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

    const target = scrollProgress.current ?? 0
    smoothProgress.current += (target - smoothProgress.current) * (1 - Math.exp(-delta * SCROLL_FOLLOW))
    const progress = smoothProgress.current

    outer.position.y = Y_OFFSET + Math.cos(progress * Math.PI * 2 * Y_CYCLES) * DRIFT_Y
    outer.position.x = pathX(progress)
    outer.scale.setScalar(0.94 + Math.sin(progress * Math.PI) * 0.12)

    if (reduceMotion) return

    spin.rotation.y += delta * YAW_SPEED

    const targetX = state.pointer.y * 0.12
    const targetY = state.pointer.x * 0.22
    outer.rotation.x += (targetX - outer.rotation.x) * Math.min(1, delta * 1.2)
    outer.rotation.y += (targetY - outer.rotation.y) * Math.min(1, delta * 1.2)
  })

  return (
    <group ref={outerRef} position={[X_START, Y_OFFSET + DRIFT_Y, 0]}>
      <Float
        speed={reduceMotion ? 0 : 0.5}
        rotationIntensity={reduceMotion ? 0 : 0.12}
        floatIntensity={reduceMotion ? 0 : 0.5}
        floatingRange={[-0.1, 0.1]}
      >
        <group ref={spinRef} rotation={[0.14, 0, -0.22]}>
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
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.4, 7], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={reduceMotion ? 'demand' : 'always'}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 4]} intensity={2.6} />
      <directionalLight position={[-5, -1, -3]} intensity={0.5} color="#8fb4e8" />

      <Suspense fallback={null}>
        <Airbus scrollProgress={scrollProgress} reduceMotion={reduceMotion} />
      </Suspense>

      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} position={[0, 4, 3]} scale={[8, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 0, 2]} scale={[4, 6, 1]} color="#8fb4e8" />
        <Lightformer form="circle" intensity={1.4} position={[4, -2, 2]} scale={4} color="#ffd9b0" />
      </Environment>
    </Canvas>
  )
}
