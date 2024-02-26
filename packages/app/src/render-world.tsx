import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { combineLatest } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getColor } from './color.js'
import styles from './render-world.module.scss'
import { getScale } from './viewport.js'
import { Patch, World } from './world.js'

export interface RenderWorldProps {
  world: World
  setWorld: Updater<World>
}

export function RenderWorld({
  world,
  setWorld,
}: RenderWorldProps) {
  const container = useRef<SVGSVGElement>(null)

  const [state, setState] = useState<{
    width: number
    height: number
  } | null>(null)

  const { camera$, viewport$ } = useContext(AppContext)

  useEffect(() => {
    viewport$.subscribe((viewport) => {
      invariant(container.current)

      const { x: vx, y: vy } = viewport.size

      const width = vx
      const height = vy

      setState({ width, height })
    })
  }, [])

  useEffect(() => {
    combineLatest([camera$, viewport$]).subscribe(
      ([camera, viewport]) => {
        invariant(camera.zoom >= 0)
        invariant(camera.zoom <= 1)

        const scale = getScale(
          camera.zoom,
          viewport.size.x,
          viewport.size.y,
        )

        invariant(container.current)
        const { x: cx, y: cy } = camera.position

        const transform = [
          `translate(${(-cx * scale).toFixed(4)} ${(-cy * scale).toFixed(4)})`,
          `scale(${scale.toFixed(4)})`,
        ].join(' ')

        container.current.setAttribute(
          'transform',
          transform,
        )
      },
    )
  }, [])

  const viewBox = [
    (state && -state.width / 2) ?? 0,
    (state && -state.height / 2) ?? 0,
    (state && state.width) ?? 0,
    (state && state.height) ?? 0,
  ].join(' ')

  return (
    <svg
      className={styles.world}
      ref={container}
      viewBox={viewBox}
    >
      {Object.values(world.patches).map((patch) => (
        <Circle
          key={patch.id}
          patch={patch}
          setWorld={setWorld}
        />
      ))}
    </svg>
  )
}

interface CircleProps {
  patch: Patch
  setWorld: Updater<World>
}

const Circle = React.memo(function Circle({
  patch: {
    id,
    position: { x, y },
    count,
    radius,
  },
  setWorld,
}: CircleProps) {
  console.log(`render patch id=${id} count=${count}`)

  return (
    <circle
      className={styles.circle}
      onPointerUp={() => {
        setWorld((draft) => {
          const patch = draft.patches[id]
          invariant(patch)
          patch.count -= 1
        })
      }}
      cx={x}
      cy={y}
      r={radius}
      style={
        {
          '--color': getColor(id),
        } as React.CSSProperties
      }
    />
  )
})
