import React, { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import styles from './render-cursor.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { getScale } from './viewport.js'
import { Patch, World } from './world.js'

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
      function update(closestPatchId?: string) {
        const { x, y } = position.current
        invariant(circle.current)
        circle.current.setAttribute('cx', `${x.toFixed(4)}`)
        circle.current.setAttribute('cy', `${y.toFixed(4)}`)
        for (const patchId of Object.keys(patches)) {
          const line = lines.current[patchId]
          invariant(line)
          line.setAttribute('x1', `${x.toFixed(4)}`)
          line.setAttribute('y1', `${y.toFixed(4)}`)
          if (patchId === closestPatchId) {
            line.style.setProperty('--stroke', 'yellow')
          } else {
            line.style.removeProperty('--stroke')
          }
        }
      }
      update(
        getClosestPatch(camera$.value, patches)?.patch.id,
      )

      let last = self.performance.now()
      function render() {
        const now = self.performance.now()
        const elapsed = now - last
        last = now

        const closest = getClosestPatch(
          camera$.value,
          patches,
        )

        let dir: Vec2
        if (closest && closest.d < 3) {
          dir = { ...closest.patch.position }
        } else {
          dir = { ...camera$.value.position }
        }

        vec2.sub(dir, position.current)
        const d = vec2.len(dir)
        vec2.norm(dir)

        let vmag = vec2.len(velocity.current)

        const threshold = 0

        if (d < 0.01) {
          velocity.current.x = 0
          velocity.current.y = 0
        } else if (d > threshold || vmag) {
          // speed is a function of the distance
          //
          // https://www.wolframalpha.com/input?i=plot+%28x+%2B+1%29+**+4+from+0+to+2
          //
          vmag = (d + 1) ** 2

          // rotate velocity if needed
          vec2.copy(velocity.current, dir)
          vec2.mul(velocity.current, vmag)
        }

        if (vmag) {
          position.current.x +=
            velocity.current.x * (elapsed / 1000)
          position.current.y +=
            velocity.current.y * (elapsed / 1000)
          update(closest?.patch.id)
        }

        handle.current = self.requestAnimationFrame(render)
      }
      handle.current = self.requestAnimationFrame(render)
      return () => {
        if (handle.current) {
          self.cancelAnimationFrame(handle.current)
        }
      }
    }, [patches])

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

function getClosestPatch(
  camera: Camera,
  patches: World['patches'],
): { patch: Patch; d: number } | null {
  let closest: Patch | null = null
  let min: number = Number.MAX_VALUE
  for (const patch of Object.values(patches)) {
    const v = vec2.clone(patch.position)
    vec2.sub(v, camera.position)
    const d = vec2.len(v)
    if (d < min) {
      min = d
      closest = patch
    }
  }
  if (closest === null) {
    return null
  }
  return { patch: closest, d: min }
}
