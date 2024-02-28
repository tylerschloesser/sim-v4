import { useContext, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { RenderCursor } from './render-cursor.js'
import { RenderPatch } from './render-patch.js'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import { World } from './world.js'

export interface RenderWorldProps {
  world: World
  setWorld: Updater<World>
}

export function RenderWorld({
  world,
  setWorld,
}: RenderWorldProps) {
  const root = useRef<SVGGElement>(null)
  const { viewport } = useContext(AppContext)

  useCameraEffect((camera) => {
    invariant(camera.zoom >= 0)
    invariant(camera.zoom <= 1)

    const { x: vx, y: vy } = viewport.size
    const scale = getScale(camera.zoom, vx, vy)

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

  return (
    <g data-group="world" ref={root}>
      <RenderCursor
        patches={world.patches}
        setWorld={setWorld}
      />
      {Object.values(world.patches).map((patch) => (
        <RenderPatch key={patch.id} patch={patch} />
      ))}
    </g>
  )
}
