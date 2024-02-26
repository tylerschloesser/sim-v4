import { times } from 'lodash-es'
import {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import styles from './render-grid.module.scss'
import { getMinScale } from './viewport.js'

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

      const left = vx / 2 - (cols * minScale) / 2
      const top = vy / 2 - (rows * minScale) / 2

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
    camera$.subscribe(() => {
      invariant(container.current)
    })
  }, [])

  return (
    <svg
      className={styles.grid}
      style={
        state
          ? ({
              '--top': `${state.top.toFixed(1)}px`,
              '--left': `${state.left.toFixed(1)}px`,
              '--width': `${state.width.toFixed(1)}px`,
              '--height': `${state.height.toFixed(1)}px`,
            } as React.CSSProperties)
          : {}
      }
      viewBox={`0 0 ${state?.vx ?? 0} ${state?.vy ?? 0}`}
      ref={container}
    >
      {state && (
        <>
          {times(state.rows + 1).map((row) => (
            <line
              key={`row-${row}`}
              x1="0"
              y1={`${(row * state.minScale).toFixed(1)}px`}
              x2={`${state.width.toFixed(1)}px`}
              y2={`${(row * state.minScale).toFixed(1)}px`}
              stroke="white"
            />
          ))}
          {times(state.cols + 1).map((col) => (
            <line
              key={`col-${col}`}
              x1={`${(col * state.minScale).toFixed(1)}px`}
              y1={'0'}
              x2={`${(col * state.minScale).toFixed(1)}px`}
              y2={`${state.height.toFixed(1)}px`}
              stroke="white"
            />
          ))}
        </>
      )}
    </svg>
  )
}
