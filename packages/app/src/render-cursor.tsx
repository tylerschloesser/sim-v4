import React, { useContext, useEffect, useRef } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { isBuildValid } from './build.js'
import { Camera } from './camera.js'
import { getClosestEntity } from './closest.js'
import {
  RouteId,
  useConnectEntityId,
  usePatchId,
  useRouteId,
} from './route.js'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { getScale } from './viewport.js'
import { Cursor, EntityType, World } from './world.js'

export interface RenderCursorProps {
  cursor: Cursor
  entities: World['entities']
  setWorld: Updater<World>
  buildValid: boolean | null
  setBuildValid(valid: boolean | null): void
}

export const RenderCursor = React.memo(
  function RenderCursor({
    cursor,
    entities,
    setWorld,
    buildValid,
    setBuildValid,
  }: RenderCursorProps) {
    const { camera$ } = useContext(AppContext)

    const patchId = usePatchId()
    const connectEntityId = useConnectEntityId()
    const routeId = useRouteId()

    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const line = useRef<SVGLineElement>(null)

    useEffect(() => {
      invariant(circle.current)
      switch (routeId) {
        case RouteId.enum.BuildMiner: {
          invariant(line.current)
          invariant(patchId)
          return initBuildCursor({
            camera$,
            circle: circle.current,
            line: line.current,
            patchId,
            entities,
            setBuildValid,
          })
        }
        case RouteId.enum.Connect: {
          invariant(line.current)
          invariant(connectEntityId)
          return initConnectCursor({
            camera$,
            circle: circle.current,
            line: line.current,
            connectEntityId,
            entities,
            setConnectValid(valid: boolean) {
              console.log('TODO', valid)
            },
          })
        }
        case RouteId.enum.Root: {
          return initDefaultCursor({
            camera$,
            circle: circle.current,
            entities,
            setWorld,
          })
        }
        default: {
          invariant(false)
        }
      }
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

    let fill = 'hsla(240, 50%, 50%, 1)'
    if (routeId === RouteId.enum.BuildMiner) {
      fill =
        buildValid === true
          ? 'hsla(120, 50%, 50%, .5)'
          : 'hsla(0, 50%, 50%, .5)'
    }

    return (
      <g data-group="cursor" ref={root}>
        {(patchId || connectEntityId) && (
          <line
            stroke={fill}
            ref={line}
            strokeWidth="var(--stroke-width)"
          />
        )}
        <circle
          r={cursor.radius}
          fill={fill}
          ref={circle}
        />
      </g>
    )
  },
)

function initBuildCursor({
  camera$,
  circle,
  line,
  patchId,
  entities,
  setBuildValid,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  patchId: string
  entities: World['entities']
  setBuildValid(valid: boolean | null): void
}): () => void {
  const patch = entities[patchId]
  invariant(patch?.type === EntityType.enum.Patch)
  line.setAttribute('x2', `${patch.position.x.toFixed(4)}`)
  line.setAttribute('y2', `${patch.position.y.toFixed(4)}`)

  const sub = camera$.subscribe((camera) => {
    const { x, y } = camera.position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)

    line.setAttribute('x1', `${x.toFixed(4)}`)
    line.setAttribute('y1', `${y.toFixed(4)}`)

    const buildValid = isBuildValid(
      camera.position,
      0.75,
      entities,
    )
    setBuildValid(buildValid)
  })

  return () => {
    sub.unsubscribe()
  }
}

function initConnectCursor({
  camera$,
  circle,
  line,
  connectEntityId,
  entities,
  setConnectValid,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  connectEntityId: string
  entities: World['entities']
  setConnectValid(valid: boolean | null): void
}): () => void {
  const source = entities[connectEntityId]
  invariant(source)

  line.setAttribute('x2', `${source.position.x.toFixed(4)}`)
  line.setAttribute('y2', `${source.position.y.toFixed(4)}`)

  const sub = camera$.subscribe((camera) => {
    const { x, y } = camera.position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)

    line.setAttribute('x1', `${x.toFixed(4)}`)
    line.setAttribute('y1', `${y.toFixed(4)}`)

    setConnectValid(false)
  })

  return () => {
    sub.unsubscribe()
  }
}

function initDefaultCursor({
  camera$,
  circle,
  entities,
  setWorld,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  entities: World['entities']
  setWorld: Updater<World>
}): () => void {
  const position = vec2.clone(camera$.value.position)
  const velocity = vec2.init(0, 0)

  function update() {
    const { x, y } = position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)
  }
  update()

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
      update()
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
