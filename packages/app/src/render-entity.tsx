import React from 'react'
import { getEntityColor } from './color.js'
import { Entity } from './world.js'

export interface RenderEntityProps {
  entity: Entity
}

export const RenderEntity = React.memo(
  function RenderEntity({ entity }: RenderEntityProps) {
    const { x, y } = entity.position
    const r = entity.radius
    const color = getEntityColor(entity)
    return (
      <g data-group={`entity-${entity.id}`}>
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={color.fill}
          stroke={color.stroke}
          // TODO set this based on viewport
          strokeWidth=".05px"
        />
      </g>
    )
  },
)
