import React, { useContext, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { RenderCursor } from './render-cursor.js'
import { RenderEntityConnection } from './render-entity-connection.js'
import { RenderEntity } from './render-entity.js'
import { RenderGeneratorPowerArea } from './render-generator-power-area.js'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import {
  Cursor,
  EntityShape,
  EntityType,
  GeneratorEntityShape,
  World,
} from './world.js'

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
      {mapGenerators(shapes, (shape) => {
        if (cursor.entityId === shape.id) {
          return (
            <RenderGeneratorPowerArea
              key={shape.id}
              shape={shape}
            />
          )
        } else {
          return null
        }
      })}
      {mapConnections(shapes, (id, source, target) => (
        <RenderEntityConnection
          key={id}
          a={source}
          b={target}
        />
      ))}
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

function getConnectionId(
  sourceId: string,
  targetId: string,
): string {
  const ids = [sourceId, targetId]
  ids.sort()
  return ids.join('.')
}

function mapGenerators(
  shapes: World['shapes'],
  cb: (shape: GeneratorEntityShape) => JSX.Element | null,
): (JSX.Element | null)[] {
  return Object.values(shapes)
    .filter(
      (shape): shape is GeneratorEntityShape =>
        shape.type === EntityType.enum.Generator,
    )
    .map((entity) => cb(entity))
}

function mapConnections(
  shapes: World['shapes'],
  cb: (
    id: string,
    source: EntityShape,
    target: EntityShape,
  ) => JSX.Element,
): JSX.Element[] {
  const seen = new Set<string>()
  const result = new Array<JSX.Element>()

  for (const source of Object.values(shapes)) {
    for (const targetId of Object.values(source.output)
      .map((entry) => Object.keys(entry))
      .flat()) {
      const id = getConnectionId(source.id, targetId)
      invariant(!seen.has(id))
      seen.add(id)
      const target = shapes[targetId]
      invariant(target)
      result.push(cb(id, source, target))
    }
  }

  return result
}
