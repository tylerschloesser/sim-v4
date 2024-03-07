import React, { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
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

    const line = useRef<SVGLineElement>(null)

    // TODO this could be the same for all lines
    useEffect(() => {
      let handle: number
      function render(now: number) {
        invariant(line.current)

        // negative value don't seem to work in safari,
        // even though the spec allows it https://www.w3.org/TR/SVG11/painting.html#StrokeDashoffsetProperty
        //
        const progress = 2 - ((now % 1000) / 1000) * 2
        line.current.style.strokeDashoffset = `calc(var(--stroke-width) * 4 * ${progress})`
        handle = requestAnimationFrame(render)
      }
      handle = requestAnimationFrame(render)
      return () => {
        cancelAnimationFrame(handle)
      }
    }, [])

    const stroke =
      variant === 'delete'
        ? 'hsla(0, 50%, 50%, .5)'
        : 'hsla(0, 0%, 50%, .5)'

    return (
      <g data-group={`entity-connection-${a.id}-${b.id}`}>
        <line
          ref={line}
          x1={a.position.x}
          y1={a.position.y}
          x2={b.position.x}
          y2={b.position.y}
          stroke={stroke}
          strokeWidth="var(--stroke-width)"
          strokeDasharray="calc(var(--stroke-width) * 4)"
          opacity={variant === 'edit' ? 0.25 : undefined}
        />
      </g>
    )
  },
)
