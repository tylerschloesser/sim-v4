import React from 'react'
import { Entity } from './world.js'

export interface RenderEntityProps {
  entity: Entity
}

export const RenderEntity = React.memo(
  function RenderEntity({ entity }: RenderEntityProps) {
    const { x, y } = entity.position
    const r = entity.radius
    return (
      <g data-group={`entity-${entity.id}`}>
        <circle cx={x} cy={y} r={r} fill="pink" />
      </g>
    )
  },
)
