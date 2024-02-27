import { Updater } from 'use-immer'
import { RenderGrid } from './render-grid.js'
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
  return (
    <>
      <RenderGrid viewport={viewport} />
      <RenderWorld
        viewport={viewport}
        world={world}
        setWorld={setWorld}
      />
    </>
  )
}
