import React, { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { dist } from './math.js'
import styles from './render-cursor.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, div, len, norm, sub } from './vec2.js'
import { getScale } from './viewport.js'
import { World } from './world.js'

export interface RenderCursorProps {
  patches: World['patches']
}

export const RenderCursor = React.memo(
  function RenderCursor({ patches }: RenderCursorProps) {
    const { camera$ } = useContext(AppContext)
    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const lines = useRef<
      Record<string, SVGLineElement | null>
    >({})

    const handle = useRef<number>()
    const position = useRef(camera$.value.position)

    const velocity = useRef<Vec2>({ x: 0, y: 0 })

    useEffect(() => {
      function update() {
        const { x, y } = position.current
        invariant(circle.current)
        circle.current.setAttribute('cx', `${x.toFixed(4)}`)
        circle.current.setAttribute('cy', `${y.toFixed(4)}`)
        for (const patchId of Object.keys(patches)) {
          const line = lines.current[patchId]
          invariant(line)
          line.setAttribute('x1', `${x.toFixed(4)}`)
          line.setAttribute('y1', `${y.toFixed(4)}`)
        }
      }
      update()

      let last = self.performance.now()
      function render() {
        const now = self.performance.now()
        const elapsed = now - last
        last = now

        const { x, y } = position.current
        const { x: cx, y: cy } = camera$.value.position
        const d = dist(x, y, cx, cy)

        if (d > 1 || len(velocity.current) > 0) {
          // update velocity
          velocity.current.x = cx
          velocity.current.y = cy
          sub(velocity.current, position.current)
          norm(velocity.current)
          div(velocity.current, 1000 / 20)

          // update position
          const dx = velocity.current.x * elapsed
          const dy = velocity.current.y * elapsed
          if (len({ x: dx, y: dy }) > d) {
            position.current.x = cx
            position.current.y = cy
            velocity.current.x = 0
            velocity.current.y = 0
          } else {
            position.current.x += dx
            position.current.y += dy
          }

          update()
        }

        handle.current = self.requestAnimationFrame(render)
      }
      handle.current = self.requestAnimationFrame(render)
      return () => {
        if (handle.current) {
          self.cancelAnimationFrame(handle.current)
        }
      }
    }, [])

    useCameraEffect(
      (camera, viewport) => {
        // const { x: cx, y: cy } = camera.position
        const { x: vx, y: vy } = viewport.size

        const scale = getScale(camera.zoom, vx, vy)

        invariant(circle.current)
        invariant(root.current)

        root.current.style.setProperty(
          '--stroke-width',
          `${((1 / scale) * 2).toFixed(2)}`,
        )
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
