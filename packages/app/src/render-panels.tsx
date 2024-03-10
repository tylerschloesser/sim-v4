import classNames from 'classnames'
import React, { useRef } from 'react'
import invariant from 'tiny-invariant'
import { ZoomLevel } from './app-context.js'
import styles from './render-panels.module.scss'
import {
  Cursor,
  Entity,
  EntityType,
  ItemType,
  World,
} from './types.js'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import { getEntity } from './world.js'

interface RenderPanelsProps {
  world: World
  cursor: Cursor
  zoomLevel: ZoomLevel
}

export const RenderPanels = React.memo(
  function RenderPanels({
    world,
    cursor,
    zoomLevel,
  }: RenderPanelsProps) {
    const ref = useRef<HTMLDivElement>(null)

    useCameraEffect((camera, viewport) => {
      const { x: vx, y: vy } = viewport.size
      const scale = getScale(camera.zoom, vx, vy)

      const { x: cx, y: cy } = camera.position

      invariant(ref.current)
      ref.current.style.setProperty('--scale', `${scale}`)
      ref.current.style.setProperty('--cx', `${cx}`)
      ref.current.style.setProperty('--cy', `${cy}`)

      ref.current.style.setProperty('--vy', `${vy}`)
    }, [])

    return (
      <div className={styles.panels} ref={ref}>
        {Object.values(world.shapes).map(({ id }) => (
          <RenderPanel
            key={id}
            entity={getEntity(world, id)}
            zoomLevel={zoomLevel}
          />
        ))}
      </div>
    )
  },
)

interface RenderPanelProps {
  entity: Entity
  zoomLevel: ZoomLevel
}

const RenderPanel = React.memo(function RenderPanel({
  entity,
  zoomLevel,
}: RenderPanelProps) {
  return (
    <div
      className={classNames(styles.panel, {
        [styles['panel--patch'] as string]:
          entity.type === EntityType.enum.Patch,
      })}
      style={
        {
          '--x': `${entity.shape.position.x}`,
          '--y': `${entity.shape.position.y}`,
          '--r': `${entity.shape.radius}`,
        } as React.CSSProperties
      }
    >
      {(() => {
        switch (entity.type) {
          case EntityType.enum.Patch: {
            const { itemType } = entity.shape
            const count = entity.state.output[itemType] ?? 0
            return (
              <>
                {itemType.replace(/^Mineable/, '')}
                <br />
                {Math.floor(count)}
              </>
            )
          }
          default: {
            const { itemType } = entity.shape
            const count = entity.state.output[itemType] ?? 0
            return (
              <>
                {Math.floor(
                  entity.state.satisfaction * 100,
                )}
                %
                <br />
                {itemType}: {Math.floor(count)}
                {zoomLevel === 'high' && (
                  <>
                    <br />
                    Coal:{' '}
                    {Math.floor(
                      entity.state.input[
                        ItemType.enum.Coal
                      ] ?? 0,
                    )}
                  </>
                )}
              </>
            )
          }
        }
      })()}
    </div>
  )
})
