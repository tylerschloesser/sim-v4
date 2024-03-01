import React, { useContext, useEffect, useRef } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { isBuildValid } from './build.js'
import { Camera } from './camera.js'
import { getClosestShape } from './closest.js'
import { isConnectValid } from './connect.js'
import {
  RouteId,
  useConnectEntityId,
  usePatchId,
  useRouteId,
} from './route.js'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { getScale } from './viewport.js'
import {
  Cursor,
  EntityShape,
  EntityType,
  World,
} from './world.js'

export interface RenderCursorProps {
  cursor: Cursor
  shapes: World['shapes']
  setWorld: Updater<World>

  buildValid: boolean | null
  setBuildValid(valid: boolean | null): void

  connectValid: boolean | null
  setConnectValid(valid: boolean | null): void
}

export const RenderCursor = React.memo(
  function RenderCursor({
    cursor,
    shapes,
    setWorld,
    buildValid,
    setBuildValid,
    connectValid,
    setConnectValid,
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
            shapes,
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
            shapes,
            setConnectValid,
            setWorld,
          })
        }
        case RouteId.enum.Root: {
          return initDefaultCursor({
            camera$,
            circle: circle.current,
            shapes,
            setWorld,
          })
        }
        default: {
          invariant(false)
        }
      }
    }, [shapes, routeId])

    useCameraEffect((camera, viewport) => {
      const { x: vx, y: vy } = viewport.size

      const scale = getScale(camera.zoom, vx, vy)

      invariant(root.current)

      root.current.style.setProperty(
        '--stroke-width',
        `${((1 / scale) * 2).toFixed(2)}`,
      )
    })

    let fill: string

    switch (routeId) {
      case RouteId.enum.BuildMiner: {
        fill =
          buildValid === true
            ? 'hsla(120, 50%, 50%, .5)'
            : 'hsla(0, 50%, 50%, .5)'
        break
      }
      case RouteId.enum.Connect: {
        fill =
          connectValid === true
            ? 'hsla(120, 50%, 50%, .5)'
            : 'hsla(0, 50%, 50%, .5)'
        break
      }
      case RouteId.enum.Root: {
        fill = 'hsla(240, 50%, 50%, 1)'
        break
      }
      default: {
        invariant(false)
      }
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
  shapes,
  setBuildValid,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  patchId: string
  shapes: World['shapes']
  setBuildValid(valid: boolean | null): void
}): () => void {
  const patch = shapes[patchId]
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
      shapes,
    )
    setBuildValid(buildValid)
  })

  return () => {
    sub.unsubscribe()
  }
}

function initHomingCursor({
  camera$,
  shapes,
  update,
  setAttachedEntityId,
}: {
  camera$: BehaviorSubject<Camera>
  shapes: World['shapes']
  update(position: Vec2): void
  setAttachedEntityId(entityId: string | null): void
}): () => void {
  const position = vec2.clone(camera$.value.position)
  const velocity = vec2.init(0, 0)

  update(position)

  let last = self.performance.now()
  let handle: number | undefined = undefined
  function render() {
    const now = self.performance.now()
    const elapsed = now - last
    last = now

    const closest = getClosestShape(camera$.value, shapes)

    let dir: Vec2
    if (closest && closest.d < 3) {
      setAttachedEntityId(closest.shape.id)

      const pull = vec2.clone(camera$.value.position)
      vec2.sub(pull, closest.shape.position)
      vec2.mul(pull, (vec2.len(pull) / (2 * 3)) ** 2.5)

      dir = vec2.clone(closest.shape.position)
      vec2.add(dir, pull)

      vec2.sub(dir, position)
    } else {
      setAttachedEntityId(null)

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
      update(position)
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

function initDefaultCursor({
  camera$,
  circle,
  shapes,
  setWorld,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  shapes: World['shapes']
  setWorld: Updater<World>
}): () => void {
  function update(position: Vec2): void {
    const { x, y } = position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)
  }
  let attachedEntityId: string | null = null
  function setAttachedEntityId(entityId: string | null) {
    if (attachedEntityId !== entityId) {
      attachedEntityId = entityId
      setWorld((draft) => {
        draft.cursor.entityId = entityId
      })
    }
  }
  return initHomingCursor({
    camera$,
    shapes,
    update,
    setAttachedEntityId,
  })
}

function initConnectCursor({
  camera$,
  circle,
  line,
  connectEntityId,
  shapes,
  setConnectValid,
  setWorld,
}: {
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  connectEntityId: string
  shapes: World['shapes']
  setConnectValid(valid: boolean | null): void
  setWorld: Updater<World>
}): () => void {
  const source = shapes[connectEntityId]
  invariant(source)
  line.setAttribute('x2', `${source.position.x.toFixed(4)}`)
  line.setAttribute('y2', `${source.position.y.toFixed(4)}`)

  function update(position: Vec2): void {
    const { x, y } = position
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)
    line.setAttribute('x1', `${x.toFixed(4)}`)
    line.setAttribute('y1', `${y.toFixed(4)}`)
  }

  let attachedEntityId: string | null = null
  function setAttachedEntityId(entityId: string | null) {
    if (attachedEntityId !== entityId) {
      attachedEntityId = entityId
      setWorld((draft) => {
        draft.cursor.entityId = entityId
      })
      let target: EntityShape | null = null
      if (entityId) {
        target = shapes[entityId] ?? null
        invariant(target)
      }
      invariant(source)
      setConnectValid(
        isConnectValid(source, target, shapes),
      )
    }
  }

  return initHomingCursor({
    camera$,
    shapes,
    update,
    setAttachedEntityId,
  })
}
