import { useContext, useRef } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { RenderGrid } from './render-grid.js'
import styles from './render-viewport.module.scss'
import { RenderWorld } from './render-world.js'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'

export function RenderViewport() {
  const root = useRef<SVGSVGElement>(null)
  const { viewport, world, setWorld } =
    useContext(AppContext)
  const { x: vx, y: vy } = viewport.size
  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')

  useCameraEffect((camera, viewport) => {
    const { x: vx, y: vy } = viewport.size

    const scale = getScale(camera.zoom, vx, vy)

    invariant(root.current)

    root.current.style.setProperty(
      '--stroke-width',
      `${((1 / scale) * 2).toFixed(2)}`,
    )
  })

  return (
    <svg
      className={styles.viewport}
      viewBox={viewBox}
      ref={root}
    >
      <RenderGrid viewport={viewport} />
      <RenderWorld
        cursor={world.cursor}
        shapes={world.shapes}
        setWorld={setWorld}
      />
    </svg>
  )
}
