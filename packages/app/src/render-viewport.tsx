import { useContext } from 'react'
import { AppContext } from './app-context.js'
import { RenderGrid } from './render-grid.js'
import styles from './render-viewport.module.scss'
import { RenderWorld } from './render-world.js'

export function RenderViewport() {
  const { viewport, world, setWorld } =
    useContext(AppContext)
  const { x: vx, y: vy } = viewport.size
  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')
  return (
    <svg className={styles.viewport} viewBox={viewBox}>
      <RenderGrid viewport={viewport} />
      <RenderWorld
        cursor={world.cursor}
        entities={world.entities}
        setWorld={setWorld}
      />
    </svg>
  )
}
