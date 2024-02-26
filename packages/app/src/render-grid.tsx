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
import styles from './render-grid.module.scss'
import { getMinScale, getScale } from './viewport.js'

export function RenderGrid() {
  const { viewport$, camera$ } = useContext(AppContext)

  const container = useRef<SVGSVGElement>(null)

  const [state, setState] = useState<{
    vx: number
    vy: number
    left: number
    top: number
    width: number
    height: number
    rows: number
    cols: number
    minScale: number
  } | null>(null)

  useEffect(() => {
    viewport$.subscribe((viewport) => {
      const { x: vx, y: vy } = viewport.size
      const minScale = getMinScale(vx, vy)

      const rows = Math.ceil(vy / minScale) + 2
      const cols = Math.ceil(vx / minScale) + 2

      const left = vx / 2 - cols / 2
      const top = vy / 2 - rows / 2

      const width = cols * minScale
      const height = rows * minScale

      setState({
        vx,
        vy,
        left,
        top,
        width,
        height,
        rows,
        cols,
        minScale,
      })
    })
  }, [])

  useEffect(() => {
    combineLatest([camera$, viewport$]).subscribe(
      ([camera, viewport]) => {
        invariant(container.current)

        const scale = getScale(
          camera.zoom,
          viewport.size.x,
          viewport.size.y,
        )

        const translateX = -camera.position.x * scale
        const translateY = -camera.position.y * scale

        const { style } = container.current
        const setVar = style.setProperty.bind(style)

        setVar('--translate-x', `${translateX}px`)
        setVar('--translate-y', `${translateY}px`)
        setVar('--scale', `${scale}`)
      },
    )
  }, [])

  const viewBox = [
    0,
    0,
    (state && state.cols + 1) ?? 0,
    (state && state.rows + 1) ?? 0,
  ].join(' ')

  return (
    <svg
      className={styles.grid}
      style={
        state
          ? ({
              '--top': `${state.top}px`,
              '--left': `${state.left}px`,
              '--width': `${state.cols + 1}px`,
              '--height': `${state.rows + 1}px`,
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
              stroke="white"
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
              stroke="white"
              strokeWidth="var(--stroke-width)"
            />
          ))}
        </>
      )}
    </svg>
  )
}
