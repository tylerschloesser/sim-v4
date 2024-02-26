import React, { useContext, useEffect, useRef } from 'react'
import { combineLatest } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getColor } from './color.js'
import styles from './render-world.module.scss'
import { Viewport, getScale } from './viewport.js'
import { Patch, World } from './world.js'

export interface RenderWorldProps {
  viewport: Viewport
  world: World
  setWorld: Updater<World>
}

export function RenderWorld({
  viewport,
  world,
  setWorld,
}: RenderWorldProps) {
  const root = useRef<SVGGElement>(null)
  const { camera$, viewport$ } = useContext(AppContext)
  const { x: vx, y: vy } = viewport.size

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

        invariant(root.current)
        const { x: cx, y: cy } = camera.position

        const transform = [
          `translate(${(-cx * scale).toFixed(4)} ${(-cy * scale).toFixed(4)})`,
          `scale(${scale.toFixed(4)})`,
        ].join(' ')

        root.current.setAttribute('transform', transform)
      },
    )
  }, [])

  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')
  return (
    <svg className={styles.world} viewBox={viewBox}>
      <g ref={root}>
        {Object.values(world.patches).map((patch) => (
          <Circle
            key={patch.id}
            patch={patch}
            setWorld={setWorld}
          />
        ))}
      </g>
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
