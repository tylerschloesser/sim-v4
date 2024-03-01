import React from 'react'
import { Entity } from './world.js'

export interface RenderEntityConnectionProps {
  a: Entity
  b: Entity
}

export const RenderEntityConnection = React.memo(
  function RenderEntityConnection({
    a,
    b,
  }: RenderEntityConnectionProps) {
    return (
      <g data-group={`entity-connection-${a.id}-${b.id}`}>
        <line
          x1={a.position.x}
          y1={a.position.y}
          x2={b.position.x}
          y2={b.position.y}
          stroke="pink"
          // TODO set this based on viewport
          strokeWidth=".05px"
        />
      </g>
    )
  },
)
