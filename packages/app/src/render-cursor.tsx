import React, { useContext, useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getClosestEntity } from './closest.js'
import styles from './render-cursor.module.scss'
import { useRouteId } from './route.js'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { getScale } from './viewport.js'
import { Cursor, World } from './world.js'

export interface RenderCursorProps {
  cursor: Cursor
  entities: World['entities']
  setWorld: Updater<World>
}

export const RenderCursor = React.memo(
  function RenderCursor({
    cursor,
    entities,
    setWorld,
  }: RenderCursorProps) {
    const { camera$ } = useContext(AppContext)

    const routeId = useRouteId()
    useEffect(() => {
      console.log('routeId', routeId)
    }, [routeId])

    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const lines = useRef<
      Record<string, SVGLineElement | null>
    >({})

    const position = useRef(camera$.value.position)

    const velocity = useRef<Vec2>({ x: 0, y: 0 })

    useEffect(() => {
      function update(closestEntityId?: string) {
        const { x, y } = position.current
        invariant(circle.current)
        circle.current.setAttribute('cx', `${x.toFixed(4)}`)
        circle.current.setAttribute('cy', `${y.toFixed(4)}`)
        for (const entityId of Object.keys(entities)) {
          const line = lines.current[entityId]
          invariant(line)
          line.setAttribute('x1', `${x.toFixed(4)}`)
          line.setAttribute('y1', `${y.toFixed(4)}`)
          if (entityId === closestEntityId) {
            line.style.setProperty('--stroke', 'yellow')
          } else {
            line.style.removeProperty('--stroke')
          }
        }
      }
      update(
        getClosestEntity(camera$.value, entities)?.entity
          .id,
      )

      let last = self.performance.now()
      let handle: number | undefined = undefined
      function render() {
        const now = self.performance.now()
        const elapsed = now - last
        last = now

        const closest = getClosestEntity(
          camera$.value,
          entities,
        )

        let dir: Vec2
        if (closest && closest.d < 3) {
          setWorld((draft) => {
            if (
              draft.cursor.entityId !== closest.entity.id
            ) {
              draft.cursor.entityId = closest.entity.id
            }
          })

          const pull = vec2.clone(camera$.value.position)
          vec2.sub(pull, closest.entity.position)
          vec2.mul(pull, (vec2.len(pull) / (2 * 3)) ** 2.5)

          dir = vec2.clone(closest.entity.position)
          vec2.add(dir, pull)

          vec2.sub(dir, position.current)
        } else {
          setWorld((draft) => {
            if (draft.cursor.entityId) {
              draft.cursor.entityId = null
            }
          })

          dir = vec2.clone(camera$.value.position)
          vec2.sub(dir, position.current)
        }

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
          // https://www.wolframalpha.com/input?i=plot+%28x+%2B+1%29+**+2+-+1+from+0+to+.5
          //
          vmag = (d * 4) ** 1.5

          // rotate velocity if needed
          vec2.copy(velocity.current, dir)
          vec2.mul(velocity.current, vmag)
        }

        if (vmag) {
          position.current.x +=
            velocity.current.x * (elapsed / 1000)
          position.current.y +=
            velocity.current.y * (elapsed / 1000)
          update(closest?.entity.id)
        }

        handle = self.requestAnimationFrame(render)
      }
      handle = self.requestAnimationFrame(render)
      return () => {
        if (handle) {
          self.cancelAnimationFrame(handle)
        }
      }
    }, [entities])

    useCameraEffect((camera, viewport) => {
      const { x: vx, y: vy } = viewport.size

      const scale = getScale(camera.zoom, vx, vy)

      invariant(root.current)

      root.current.style.setProperty(
        '--stroke-width',
        `${((1 / scale) * 2).toFixed(2)}`,
      )
    })

    return (
      <g data-group="cursor" ref={root}>
        {Object.values(entities).map(({ id, position }) => (
          <line
            ref={(line) => (lines.current[id] = line)}
            className={styles.line}
            key={id}
            x2={position.x}
            y2={position.y}
          />
        ))}
        <circle
          r={cursor.radius}
          fill={'red'}
          ref={circle}
        />
      </g>
    )
  },
)
