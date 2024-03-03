import React, {
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import { getClosestShape } from './closest.js'
import { useCameraEffect } from './use-camera-effect.js'
import { Vec2, vec2 } from './vec2.js'
import { ViewContext } from './view-context.js'
import { ConnectAction, ViewType } from './view.js'
import { getScale } from './viewport.js'
import {
  Cursor,
  EntityId,
  EntityType,
  World,
} from './world.js'

export interface RenderCursorProps {
  cursor: Cursor
  shapes: World['shapes']
  setWorld: Updater<World>
}

export const RenderCursor = React.memo(
  function RenderCursor({
    cursor,
    shapes,
    setWorld,
  }: RenderCursorProps) {
    const { camera$ } = useContext(AppContext)
    const { view } = useContext(ViewContext)
    const position = useRef<Vec2>(
      vec2.clone(camera$.value.position),
    )

    const root = useRef<SVGGElement>(null)
    const circle = useRef<SVGCircleElement>(null)
    const line = useRef<SVGLineElement>(null)

    useEffect(() => {
      invariant(circle.current)
      switch (view.type) {
        case ViewType.enum.Build: {
          invariant(line.current)

          // TODO refactor
          invariant(
            view.entityType === EntityType.enum.Miner,
          )
          const keys = Object.keys(view.connections)
          invariant(keys.length === 1)
          const patchId = EntityId.parse(keys.at(0))

          return initBuildCursor({
            position,
            camera$,
            circle: circle.current,
            line: line.current,
            patchId,
            shapes,
          })
        }
        case ViewType.enum.Connect: {
          invariant(line.current)
          return initConnectCursor({
            position,
            camera$,
            circle: circle.current,
            line: line.current,
            sourceId: view.sourceId,
            shapes,
            setWorld,
          })
        }
        case ViewType.enum.Default: {
          return initDefaultCursor({
            position,
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
    }, [shapes, view])

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

    switch (view.type) {
      case ViewType.enum.Build: {
        fill = view.valid
          ? 'hsla(120, 50%, 50%, .5)'
          : 'hsla(0, 50%, 50%, .5)'
        break
      }
      case ViewType.enum.Connect: {
        fill =
          view.action === ConnectAction.enum.Connect
            ? 'hsla(120, 50%, 50%, .5)'
            : 'hsla(0, 50%, 50%, .5)'
        break
      }
      case ViewType.enum.Default: {
        fill = 'hsla(240, 50%, 50%, 1)'
        break
      }
      default: {
        invariant(false)
      }
    }

    const renderLine =
      view.type === ViewType.enum.Build ||
      view.type === ViewType.enum.Connect

    return (
      <g data-group="cursor" ref={root}>
        {renderLine && (
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
  position,
  camera$,
  circle,
  line,
  patchId,
  shapes,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  patchId: string
  shapes: World['shapes']
}): () => void {
  const patch = shapes[patchId]
  invariant(patch?.type === EntityType.enum.Patch)
  line.setAttribute('x2', `${patch.position.x.toFixed(4)}`)
  line.setAttribute('y2', `${patch.position.y.toFixed(4)}`)

  const sub = camera$.subscribe((camera) => {
    position.current = vec2.clone(camera.position)
    const { x, y } = position.current
    circle.setAttribute('cx', `${x.toFixed(4)}`)
    circle.setAttribute('cy', `${y.toFixed(4)}`)

    line.setAttribute('x1', `${x.toFixed(4)}`)
    line.setAttribute('y1', `${y.toFixed(4)}`)
  })

  return () => {
    sub.unsubscribe()
  }
}

function initHomingCursor({
  position,
  camera$,
  shapes,
  update,
  setAttachedEntityId,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  shapes: World['shapes']
  update(position: Vec2): void
  setAttachedEntityId(entityId: string | null): void
}): () => void {
  const velocity = vec2.init(0, 0)

  update(position.current)

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

      vec2.sub(dir, position.current)
    } else {
      setAttachedEntityId(null)

      dir = vec2.clone(camera$.value.position)
      vec2.sub(dir, position.current)
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
      position.current.x += velocity.x * (elapsed / 1000)
      position.current.y += velocity.y * (elapsed / 1000)
      update(position.current)
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
  position,
  camera$,
  circle,
  shapes,
  setWorld,
}: {
  position: MutableRefObject<Vec2>
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
  function setAttachedEntityId(entityId: string | null) {
    setWorld((draft) => {
      draft.cursor.entityId = entityId
    })
  }
  return initHomingCursor({
    position,
    camera$,
    shapes,
    update,
    setAttachedEntityId,
  })
}

function initConnectCursor({
  position,
  camera$,
  circle,
  line,
  sourceId,
  shapes,
  setWorld,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  circle: SVGCircleElement
  line: SVGLineElement
  sourceId: EntityId
  shapes: World['shapes']
  setWorld: Updater<World>
}): () => void {
  const source = shapes[sourceId]
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

  function setAttachedEntityId(entityId: string | null) {
    setWorld((draft) => {
      draft.cursor.entityId = entityId
    })
  }

  return initHomingCursor({
    position,
    camera$,
    shapes,
    update,
    setAttachedEntityId,
  })
}
