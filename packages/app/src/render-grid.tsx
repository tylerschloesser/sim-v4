import { times } from 'lodash-es'
import {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { combineLatest } from 'rxjs'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { mod } from './math.js'
import styles from './render-grid.module.scss'
import { getMinScale, getScale } from './viewport.js'

export function RenderGrid() {
  const { viewport$, camera$ } = useContext(AppContext)

  const container = useRef<SVGSVGElement>(null)

  const [state, setState] = useState<{
    left: number
    top: number
    rows: number
    cols: number
  } | null>(null)

  useEffect(() => {
    viewport$.subscribe((viewport) => {
      const { x: vx, y: vy } = viewport.size
      const minScale = getMinScale(vx, vy)

      const rows = Math.ceil(vy / minScale) + 2
      const cols = Math.ceil(vx / minScale) + 2

      const left = vx / 2 - cols / 2
      const top = vy / 2 - rows / 2

      setState({
        left,
        top,
        rows,
        cols,
      })
    })
  }, [])

  useEffect(() => {
    combineLatest([camera$, viewport$]).subscribe(
      ([camera, viewport]) => {
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
      },
    )
  }, [])

  const viewBox = [
    0,
    0,
    (state && state.cols) ?? 0,
    (state && state.rows) ?? 0,
  ].join(' ')

  return (
    <svg
      className={styles.grid}
      style={
        state
          ? ({
              '--top': `${state.top}px`,
              '--left': `${state.left}px`,
              '--width': `${state.cols}px`,
              '--height': `${state.rows}px`,
            } as React.CSSProperties)
          : {}
      }
      viewBox={viewBox}
      ref={container}
    >
      {state && (
        <>
          {times(state.rows + 1).map((row) => (
            <line
              key={`row-${row}`}
              x1="0"
              y1={`${row}`}
              x2={`${state.cols}`}
              y2={`${row}`}
              stroke="var(--stroke)"
              strokeWidth="var(--stroke-width)"
            />
          ))}
          {times(state.cols + 1).map((col) => (
            <line
              key={`col-${col}`}
              x1={`${col}`}
              y1={'0'}
              x2={`${col}`}
              y2={`${state.rows}`}
              stroke="var(--stroke)"
              strokeWidth="var(--stroke-width)"
            />
          ))}
        </>
      )}
    </svg>
  )
}
