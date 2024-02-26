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

  const root = useRef<SVGGElement>(null)

  const { x: vx, y: vy } = viewport.size
  const minScale = getMinScale(vx, vy)

  const rows = Math.ceil(vy / minScale / 2 + 1) * 2
  const cols = Math.ceil(vx / minScale / 2 + 1) * 2

  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      invariant(root.current)

      const { x: vx, y: vy } = viewport.size
      const scale = getScale(camera.zoom, vx, vy)

      const { x: cx, y: cy } = camera.position
      const tx = mod(-cx * scale, scale)
      const ty = mod(-cy * scale, scale)

      const transform = [
        `translate(${tx.toFixed(4)} ${ty.toFixed(4)})`,
        `scale(${scale.toFixed(4)})`,
      ].join(' ')
      root.current.setAttribute('transform', transform)

      const strokeWidth = ((1 / scale) * 2) / viewport.dpr
      root.current.style.setProperty(
        '--stroke-width',
        `${strokeWidth.toFixed(4)}px`,
      )
    })
    return () => {
      sub.unsubscribe()
    }
  }, [viewport])

  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')

  return (
    <svg className={styles.grid} viewBox={viewBox}>
      <g data-group="transform" ref={root}>
        <g data-group="rows">
          {times(rows + 1).map((row) => (
            <line
              className={styles.line}
              key={`row-${row}`}
              x1={-cols / 2}
              y1={-rows / 2 + row}
              x2={cols / 2}
              y2={-rows / 2 + row}
            />
          ))}
        </g>
        <g data-group="cols">
          {times(cols + 1).map((col) => (
            <line
              key={`col-${col}`}
              className={styles.line}
              x1={-cols / 2 + col}
              y1={-rows / 2}
              x2={-cols / 2 + col}
              y2={rows / 2}
            />
          ))}
        </g>
      </g>
    </svg>
  )
}
