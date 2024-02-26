import { times } from 'lodash-es'
import { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { mod } from './math.js'
import styles from './render-grid.module.scss'
import {
  Viewport,
  getMinScale,
  getScale,
} from './viewport.js'

export interface RenderGridProps {
  viewport: Viewport
}

export function RenderGrid({ viewport }: RenderGridProps) {
  const { camera$ } = useContext(AppContext)

  const container = useRef<SVGSVGElement>(null)

  const { x: vx, y: vy } = viewport.size
  const minScale = getMinScale(vx, vy)

  const rows = Math.ceil(vy / minScale) + 2
  const cols = Math.ceil(vx / minScale) + 2

  const left = vx / 2 - cols / 2
  const top = vy / 2 - rows / 2

  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      invariant(container.current)

      const { x: vx, y: vy } = viewport.size
      const scale = getScale(camera.zoom, vx, vy)

      const { x: cx, y: cy } = camera.position
      const translateX = mod(-cx * scale, scale)
      const translateY = mod(-cy * scale, scale)

      const { style } = container.current
      const setVar = style.setProperty.bind(style)

      setVar('--translate-x', `${translateX}px`)
      setVar('--translate-y', `${translateY}px`)
      setVar('--scale', `${scale}`)

      const strokeWidth = 1 / scale
      setVar('--stroke-width', `${strokeWidth}px`)
    })
    return () => {
      sub.unsubscribe()
    }
  }, [viewport])

  const viewBox = [0, 0, cols, rows].join(' ')

  return (
    <svg
      className={styles.grid}
      style={
        {
          '--top': `${top}px`,
          '--left': `${left}px`,
          '--width': `${cols}px`,
          '--height': `${rows}px`,
        } as React.CSSProperties
      }
      viewBox={viewBox}
      ref={container}
    >
      {
        <>
          <g data-group="rows">
            {times(rows + 1).map((row) => (
              <line
                key={`row-${row}`}
                x1="0"
                y1={`${row}`}
                x2={`${cols}`}
                y2={`${row}`}
                stroke="var(--stroke)"
                strokeWidth="var(--stroke-width)"
              />
            ))}
          </g>
          <g data-group="cols">
            {times(cols + 1).map((col) => (
              <line
                key={`col-${col}`}
                x1={`${col}`}
                y1={'0'}
                x2={`${col}`}
                y2={`${rows}`}
                stroke="var(--stroke)"
                strokeWidth="var(--stroke-width)"
              />
            ))}
          </g>
        </>
      }
    </svg>
  )
}
