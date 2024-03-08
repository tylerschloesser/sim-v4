import React, { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { RenderCursor } from './render-cursor.js'
import {
  RenderEntityConnection,
  RenderEntityConnectionProps,
} from './render-entity-connection.js'
import { RenderEntity } from './render-entity.js'
import { useCameraEffect } from './use-camera-effect.js'
import { View, ViewType } from './view.js'
import { getScale } from './viewport.js'
import {
  Cursor,
  EntityShape,
  ItemType,
  World,
} from './world.js'

export interface RenderWorldProps {
  cursor: Cursor
  shapes: World['shapes']
  setWorld: Updater<World>
  view: View
}

export const RenderWorld = React.memo(function RenderWorld({
  cursor,
  shapes,
  setWorld,
  view,
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

  useEffect(() => {
    let handle: number
    function render(now: number) {
      invariant(root.current)

      // negative value don't seem to work in safari,
      // even though the spec allows it https://www.w3.org/TR/SVG11/painting.html#StrokeDashoffsetProperty
      //
      const progress = 2 - ((now % 1000) / 1000) * 2
      root.current.style.setProperty(
        '--stroke-dashoffset',
        `calc(var(--stroke-width) * 4 * ${progress})`,
      )
      handle = requestAnimationFrame(render)
    }
    handle = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(handle)
    }
  }, [])

  return (
    <g data-group="world" ref={root}>
      {mapConnections(
        shapes,
        view,
        (id, source, target, variant) => (
          <RenderEntityConnection
            key={id}
            a={source}
            b={target}
            variant={variant}
          />
        ),
      )}
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
            variant={
              view.type === ViewType.enum.Edit &&
              view.entityId === shape.id
                ? 'edit'
                : undefined
            }
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
  if (sourceId < targetId) {
    return `${sourceId}.${targetId}`
  }
  return `${targetId}.${sourceId}`
}

function mapConnections(
  shapes: World['shapes'],
  view: View,
  cb: (
    id: string,
    source: EntityShape,
    target: EntityShape,
    variant: RenderEntityConnectionProps['variant'],
  ) => JSX.Element,
): JSX.Element[] {
  const seen = new Set<string>()
  const result = new Array<JSX.Element>()

  for (const source of Object.values(shapes)) {
    for (const [key, targetIds] of Object.entries(
      source.output,
    )) {
      const itemType = ItemType.parse(key)

      for (const targetId of Object.keys(targetIds)) {
        const id = getConnectionId(source.id, targetId)
        invariant(!seen.has(id))
        seen.add(id)

        let variant: RenderEntityConnectionProps['variant'] =
          undefined
        if (
          (view.type === ViewType.enum.Build ||
            (view.type === ViewType.enum.Edit &&
              source.id !== view.entityId)) &&
          view.output[itemType]?.[targetId]
        ) {
          variant = 'delete'
        } else if (
          view?.type === ViewType.enum.Edit &&
          (view.entityId === targetId ||
            view.entityId === source.id)
        ) {
          variant = 'edit'
        }

        const target = shapes[targetId]
        invariant(target)
        result.push(cb(id, source, target, variant))
      }
    }
  }

  if (view.type === ViewType.enum.Edit) {
    for (const [targetId, value] of Object.entries(
      view.effects,
    )) {
      const target = shapes[targetId]
      invariant(target)

      for (const sourceId of Object.values(value)) {
        const source = shapes[sourceId]
        invariant(source)

        const id = getConnectionId(sourceId, targetId)

        // invariant(!seen.has(id))
        if (seen.has(id)) {
          // TODO this happens because we complete the edit before updating the view
          // so during the intermediate render, this connection appears twice
          // Not sure of an elegant way to avoid this
          continue
        }

        seen.add(id)

        const variant: RenderEntityConnectionProps['variant'] =
          view.valid ? 'valid' : 'invalid'

        result.push(cb(id, source, target, variant))
      }
    }
  }

  return result
}
