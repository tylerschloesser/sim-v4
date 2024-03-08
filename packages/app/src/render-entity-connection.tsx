import React from 'react'
import { EntityShape } from './world.js'

export interface RenderEntityConnectionProps {
  a: EntityShape
  b: EntityShape
  variant?: 'delete' | 'edit' | 'valid' | 'invalid'
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

    let stroke: string
    switch (variant) {
      case 'invalid':
      case 'delete': {
        stroke = 'hsla(0, 50%, 50%, .5)'
        break
      }
      case 'valid': {
        stroke = 'hsla(120, 50%, 50%, .5)'
        break
      }
      default: {
        stroke = 'hsla(0, 0%, 50%, .5)'
      }
    }

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
