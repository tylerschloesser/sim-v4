import { useContext } from 'react'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { RenderGrid } from './render-grid.js'
import styles from './render-viewport.module.scss'
import { RenderWorld } from './render-world.js'
import { World } from './world.js'

export interface RenderViewportProps {
  world: World
  setWorld: Updater<World>
}

export function RenderViewport({
  world,
  setWorld,
}: RenderViewportProps) {
  const { viewport } = useContext(AppContext)
  const { x: vx, y: vy } = viewport.size
  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')
  return (
    <svg className={styles.viewport} viewBox={viewBox}>
      <RenderGrid />
      <RenderWorld world={world} setWorld={setWorld} />
    </svg>
  )
}
