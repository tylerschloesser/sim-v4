import React from 'react'
import { ConnectionType, EntityShape } from './world.js'

export interface RenderEntityConnectionProps {
  a: EntityShape
  b: EntityShape
  type: ConnectionType
}

export const RenderEntityConnection = React.memo(
  function RenderEntityConnection({
    a,
    b,
    type,
  }: RenderEntityConnectionProps) {
    return (
      <g data-group={`entity-connection-${a.id}-${b.id}`}>
        <line
          x1={a.position.x}
          y1={a.position.y}
          x2={b.position.x}
          y2={b.position.y}
          stroke={
            type === ConnectionType.enum.Item
              ? 'pink'
              : 'yellow'
          }
          // TODO set this based on viewport
          strokeWidth="var(--stroke-width)"
          strokeDasharray="calc(var(--stroke-width) * 4)"
        />
      </g>
    )
  },
)
