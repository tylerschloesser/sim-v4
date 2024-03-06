import React, { useRef } from 'react'
import invariant from 'tiny-invariant'
import styles from './render-panels.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import { Entity, World, getEntity } from './world.js'

interface RenderPanelsProps {
  world: World
}

export const RenderPanels = React.memo(
  function RenderPanels({ world }: RenderPanelsProps) {
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
          />
        ))}
      </div>
    )
  },
)

interface RenderPanelProps {
  entity: Entity
}

const RenderPanel = React.memo(function RenderPanel({
  entity,
}: RenderPanelProps) {
  return (
    <div
      className={styles.panel}
      style={
        {
          '--x': `${entity.shape.position.x}`,
          '--y': `${entity.shape.position.y}`,
        } as React.CSSProperties
      }
    >
      {entity.id}
    </div>
  )
})
