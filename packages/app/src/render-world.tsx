import React, { useContext, useEffect, useRef } from 'react'
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
  const container = useRef<HTMLDivElement>(null)

  const { camera$, viewport$ } = useContext(AppContext)

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

        const translate = {
          x:
            viewport.size.x / 2 +
            -camera.position.x * scale,
          y:
            viewport.size.y / 2 +
            -camera.position.y * scale,
        }

        invariant(container.current)

        // prettier-ignore
        {
          container.current.style.setProperty('--translate-x', `${translate.x}px`)
          container.current.style.setProperty('--translate-y', `${translate.y}px`)
          container.current.style.setProperty('--scale', `${scale}`)
        }
      },
    )
  }, [])

  return (
    <div className={styles.world} ref={container}>
      {Object.values(world.patches).map((patch) => (
        <Circle
          key={patch.id}
          patch={patch}
          setWorld={setWorld}
        />
      ))}
    </div>
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
    <svg
      className={styles.circle}
      style={
        {
          '--color': getColor(id),
          '--x': x,
          '--y': y,
          '--radius': radius,
        } as React.CSSProperties
      }
      viewBox="0 0 100 100"
    >
      <circle
        onPointerUp={() => {
          setWorld((draft) => {
            const patch = draft.patches[id]
            invariant(patch)
            patch.count -= 1
          })
        }}
        cx="50"
        cy="50"
        r="50"
        style={{
          fill: 'var(--color)',
        }}
      />
    </svg>
  )
})
