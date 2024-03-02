import React, { useContext, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getConnectedPatchShape } from './miner.js'
import { RenderCursor } from './render-cursor.js'
import { RenderEntityConnection } from './render-entity-connection.js'
import { RenderEntity } from './render-entity.js'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import { Cursor, EntityType, World } from './world.js'

export interface RenderWorldProps {
  cursor: Cursor
  shapes: World['shapes']
  setWorld: Updater<World>
}

export const RenderWorld = React.memo(function RenderWorld({
  cursor,
  shapes,
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

    // shift the world up a bit to allow more room on the bottom
    // for finger gestures
    const ty = -cy * scale - vy * 0.1

    const transform = [
      `translate(${tx.toFixed(4)} ${ty.toFixed(4)})`,
      `scale(${scale.toFixed(4)})`,
    ].join(' ')

    root.current.setAttribute('transform', transform)
  })

  return (
    <g data-group="world" ref={root}>
      {Object.values(shapes).map((shape) => {
        if (shape.type !== EntityType.enum.Miner) {
          return null
        }
        const patchShape = getConnectedPatchShape(
          shape,
          shapes,
        )
        if (patchShape === null) {
          return null
        }
        return (
          <RenderEntityConnection
            key={shape.id}
            a={shape}
            b={patchShape}
          />
        )
      })}
      <RenderCursor
        cursor={cursor}
        shapes={shapes}
        setWorld={setWorld}
      />
      {Object.values(shapes).map((shape) => {
        return (
          <RenderEntity
            key={shape.id}
            entityId={shape.id}
          />
        )
      })}
    </g>
  )
})
