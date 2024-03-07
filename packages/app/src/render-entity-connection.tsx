import React, { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
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
    const line = useRef<SVGLineElement>(null)

    // TODO this could be the same for all lines
    useEffect(() => {
      let handle: number
      function render(now: number) {
        invariant(line.current)
        line.current.style.strokeDashoffset = `calc(var(--stroke-width) * 4 * -2 * ${(now % 1000) / 1000})`
        handle = requestAnimationFrame(render)
      }
      handle = requestAnimationFrame(render)
      return () => {
        cancelAnimationFrame(handle)
      }
    }, [])

    return (
      <g data-group={`entity-connection-${a.id}-${b.id}`}>
        <line
          ref={line}
          x1={a.position.x}
          y1={a.position.y}
          x2={b.position.x}
          y2={b.position.y}
          stroke={'hsla(0, 0%, 50%, .5)'}
          strokeWidth="var(--stroke-width)"
          strokeDasharray="calc(var(--stroke-width) * 4)"
        />
      </g>
    )
  },
)
