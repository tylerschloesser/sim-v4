import React from 'react'
import { EntityShape } from './world.js'

export interface RenderEntityConnectionProps {
  a: EntityShape
  b: EntityShape
  variant?: 'delete' | 'edit'
}

export const RenderEntityConnection = React.memo(
  function RenderEntityConnection({
    a,
    b,
    variant,
  }: RenderEntityConnectionProps) {
    if (a.id === b.id) {
      // special case where the entity connects to itself
      return null
    }

    const stroke =
      variant === 'delete'
        ? 'hsla(0, 50%, 50%, .5)'
        : 'hsla(0, 0%, 50%, .5)'

    return (
      <g data-group={`entity-connection-${a.id}-${b.id}`}>
        <line
          x1={a.position.x}
          y1={a.position.y}
          x2={b.position.x}
          y2={b.position.y}
          stroke={stroke}
          strokeWidth="var(--stroke-width)"
          strokeDasharray="var(--stroke-dasharray)"
          strokeDashoffset="var(--stroke-dashoffset)"
          opacity={variant === 'edit' ? 0.25 : undefined}
        />
      </g>
    )
  },
)
