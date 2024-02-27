import React, { useRef } from 'react'
import invariant from 'tiny-invariant'
import styles from './render-cursor.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import { getScale } from './viewport.js'
import { World } from './world.js'

export interface RenderCursorProps {
  patches: World['patches']
}

export const RenderCursor = React.memo(
  function RenderCursor({ patches }: RenderCursorProps) {
    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const lines = useRef<
      Record<string, SVGLineElement | null>
    >({})

    useCameraEffect(
      (camera, viewport) => {
        const { x: cx, y: cy } = camera.position
        const { x: vx, y: vy } = viewport.size

        const scale = getScale(camera.zoom, vx, vy)

        invariant(circle.current)
        invariant(root.current)

        root.current.style.setProperty(
          '--stroke-width',
          `${((1 / scale) * 2).toFixed(2)}`,
        )

        // prettier-ignore
        {
          circle.current.setAttribute('cx', `${cx.toFixed(4)}`)
          circle.current.setAttribute('cy', `${cy.toFixed(4)}`)
        }

        for (const patchId of Object.keys(patches)) {
          const line = lines.current[patchId]
          invariant(line)
          line.setAttribute('x1', `${cx.toFixed(4)}`)
          line.setAttribute('y1', `${cy.toFixed(4)}`)
        }
      },
      [patches],
    )

    return (
      <g data-group="cursor" ref={root}>
        {Object.values(patches).map(({ id, position }) => (
          <line
            ref={(line) => (lines.current[id] = line)}
            className={styles.line}
            key={id}
            x2={position.x}
            y2={position.y}
          />
        ))}
        <circle r={1} fill={'red'} ref={circle} />
      </g>
    )
  },
)
