import React from 'react'
import { EntityShape } from './world.js'

export interface RenderEntityConnectionProps {
  a: EntityShape
  b: EntityShape
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
          stroke={'pink'}
          strokeWidth="var(--stroke-width)"
          strokeDasharray="calc(var(--stroke-width) * 4)"
        />
      </g>
    )
  },
)
