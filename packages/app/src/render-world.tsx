import { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { RenderPatch } from './render-patch.js'
import { RenderPickaxe } from './render-pickaxe.js'
import { Viewport, getScale } from './viewport.js'
import { World } from './world.js'

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
  const { camera$ } = useContext(AppContext)

  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      invariant(camera.zoom >= 0)
      invariant(camera.zoom <= 1)

      const scale = getScale(
        camera.zoom,
        viewport.size.x,
        viewport.size.y,
      )

      invariant(root.current)
      const { x: cx, y: cy } = camera.position

      const tx = -cx * scale
      const ty = -cy * scale

      const transform = [
        `translate(${tx.toFixed(4)} ${ty.toFixed(4)})`,
        `scale(${scale.toFixed(4)})`,
      ].join(' ')

      root.current.setAttribute('transform', transform)
    })

    return () => {
      sub.unsubscribe()
    }
  }, [viewport])

  return (
    <g data-group="transform" ref={root}>
      {Object.values(world.patches).map((patch) => (
        <RenderPatch
          key={patch.id}
          patch={patch}
          setWorld={setWorld}
        />
      ))}
      <RenderPickaxe
        pickaxe={world.pickaxe}
        patch={(() => {
          const { patchId } = world.pickaxe
          if (patchId) {
            const patch = world.patches[patchId]
            invariant(patch)
            return patch
          }
          return null
        })()}
        setWorld={setWorld}
      />
    </g>
  )
}
