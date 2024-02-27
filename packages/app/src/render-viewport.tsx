import { Updater } from 'use-immer'
import { RenderGrid } from './render-grid.js'
import styles from './render-viewport.module.scss'
import { RenderWorld } from './render-world.js'
import { Viewport } from './viewport.js'
import { World } from './world.js'

export interface RenderViewportProps {
  viewport: Viewport
  world: World
  setWorld: Updater<World>
}

export function RenderViewport({
  viewport,
  world,
  setWorld,
}: RenderViewportProps) {
  const { x: vx, y: vy } = viewport.size
  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')
  return (
    <svg className={styles.viewport} viewBox={viewBox}>
      <RenderGrid viewport={viewport} />
      <RenderWorld
        viewport={viewport}
        world={world}
        setWorld={setWorld}
      />
    </svg>
  )
}
