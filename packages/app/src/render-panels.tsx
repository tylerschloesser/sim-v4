import React from 'react'
import styles from './render-panels.module.scss'
import { Entity, World, getEntity } from './world.js'

interface RenderPanelsProps {
  world: World
}

export const RenderPanels = React.memo(
  function RenderPanels({ world }: RenderPanelsProps) {
    return (
      <div className={styles.panels}>
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
  return <>{entity.id}</>
})
