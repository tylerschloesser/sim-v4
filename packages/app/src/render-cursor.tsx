import React, { useContext, useEffect, useRef } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import { getClosestEntity } from './closest.js'
import styles from './render-cursor.module.scss'
import { RouteId, useRouteId } from './route.js'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { getScale } from './viewport.js'
import { Cursor, World } from './world.js'

export interface RenderCursorProps {
  cursor: Cursor
  entities: World['entities']
  setWorld: Updater<World>
  setBuildValid(valid: boolean | null): void
}

export const RenderCursor = React.memo(
  function RenderCursor({
    cursor,
    entities,
    setWorld,
    setBuildValid,
  }: RenderCursorProps) {
    const { camera$ } = useContext(AppContext)

    const routeId = useRouteId()
    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const lines = useRef<
      Record<string, SVGLineElement | null>
    >({})

    useEffect(() => {
      invariant(circle.current)
      invariant(lines.current)
      if (routeId === RouteId.enum.BuildMiner) {
        return initBuildCursor({
          camera$,
          circle: circle.current,
          entities,
          lines: lines.current,
          setWorld,
          setBuildValid,
        })
      }
      return initDefaultCursor({
        camera$,
        circle: circle.current,
        entities,
        lines: lines.current,
        setWorld,
      })
    }, [entities, routeId])

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

function initBuildCursor({
  camera$,
  circle,
  // lines,
  // entities,
  // setWorld,
  setBuildValid,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  lines: Record<string, SVGLineElement | null>
  entities: World['entities']
  setWorld: Updater<World>
  setBuildValid(valid: boolean | null): void
}): () => void {
  const sub = camera$.subscribe((camera) => {
    const { x, y } = camera.position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)
  })

  setBuildValid(false)

  return () => {
    sub.unsubscribe()
  }
}

function initDefaultCursor({
  camera$,
  circle,
  lines,
  entities,
  setWorld,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  lines: Record<string, SVGLineElement | null>
  entities: World['entities']
  setWorld: Updater<World>
}): () => void {
  const position = vec2.clone(camera$.value.position)
  const velocity = vec2.init(0, 0)

  function update(closestEntityId?: string) {
    const { x, y } = position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)
    for (const entityId of Object.keys(entities)) {
      const line = lines[entityId]
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
    getClosestEntity(camera$.value, entities)?.entity.id,
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
        if (draft.cursor.entityId !== closest.entity.id) {
          draft.cursor.entityId = closest.entity.id
        }
      })

      const pull = vec2.clone(camera$.value.position)
      vec2.sub(pull, closest.entity.position)
      vec2.mul(pull, (vec2.len(pull) / (2 * 3)) ** 2.5)

      dir = vec2.clone(closest.entity.position)
      vec2.add(dir, pull)

      vec2.sub(dir, position)
    } else {
      setWorld((draft) => {
        if (draft.cursor.entityId) {
          draft.cursor.entityId = null
        }
      })

      dir = vec2.clone(camera$.value.position)
      vec2.sub(dir, position)
    }

    const d = vec2.len(dir)
    vec2.norm(dir)

    let vmag = vec2.len(velocity)

    const threshold = 0

    if (d < 0.01) {
      velocity.x = 0
      velocity.y = 0
    } else if (d > threshold || vmag) {
      // speed is a function of the distance
      //
      // https://www.wolframalpha.com/input?i=plot+%28x+%2B+1%29+**+2+-+1+from+0+to+.5
      //
      vmag = (d * 4) ** 1.5

      // rotate velocity if needed
      vec2.copy(velocity, dir)
      vec2.mul(velocity, vmag)
    }

    if (vmag) {
      position.x += velocity.x * (elapsed / 1000)
      position.y += velocity.y * (elapsed / 1000)
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
}
