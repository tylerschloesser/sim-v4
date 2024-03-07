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
import { Vec2, vec2 } from './vec2.js'
import { ViewContext } from './view-context.js'
import { BuildView, EditView, ViewType } from './view.js'
import { Cursor, EntityId, World } from './world.js'

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

    const g = useRef<SVGGElement>(null)
    const lines = useRef<
      Record<string, SVGLineElement | null>
    >({})

    useEffect(() => {
      invariant(g.current)
      switch (view.type) {
        case ViewType.enum.Build: {
          return initBuildCursor({
            position,
            camera$,
            g: g.current,
            lines: lines.current,
            view,
            shapes,
          })
        }
        case ViewType.enum.Edit: {
          return initEditCursor({
            position,
            camera$,
            g: g.current,
            lines: lines.current,
            view,
            shapes,
          })
        }
        case ViewType.enum.Select: {
          return initDefaultCursor({
            position,
            camera$,
            g: g.current,
            shapes,
            setWorld,
          })
        }
        case ViewType.enum.Default: {
          return initDefaultCursor({
            position,
            camera$,
            g: g.current,
            shapes,
            setWorld,
          })
        }
        default: {
          invariant(false)
        }
      }
    }, [shapes, view])

    let fill: string

    switch (view.type) {
      case ViewType.enum.Build:
      case ViewType.enum.Edit: {
        fill = view.valid
          ? 'hsla(120, 50%, 50%, .5)'
          : 'hsla(0, 50%, 50%, .5)'
        break
      }
      case ViewType.enum.Select:
      case ViewType.enum.Default: {
        fill = 'hsla(240, 50%, 50%, 1)'
        break
      }
      default: {
        invariant(false)
      }
    }

    return (
      <g data-group="cursor">
        {(view.type === ViewType.enum.Build ||
          view.type === ViewType.enum.Edit) && (
          <>
            {mapConnectedEntityIds(view, (id) => (
              <line
                key={id}
                stroke={fill}
                ref={(el) => (lines.current[id] = el)}
                strokeWidth="var(--stroke-width)"
              />
            ))}
          </>
        )}
        <g ref={g}>
          <circle r={cursor.radius} fill={fill} />
        </g>
      </g>
    )
  },
)

function* iterateConnectedEntityIds(
  view: BuildView | EditView,
) {
  const seen = new Set<EntityId>()
  for (const entityId of Object.values(view.input)
    .map((entry) => Object.keys(entry))
    .flat()) {
    if (seen.has(entityId)) {
      continue
    }
    seen.add(entityId)
    yield entityId
  }
  for (const entityId of Object.values(view.output)
    .map((entry) => Object.keys(entry))
    .flat()) {
    if (seen.has(entityId)) {
      continue
    }
    seen.add(entityId)
    yield entityId
  }
}

function mapConnectedEntityIds(
  view: BuildView | EditView,
  cb: (id: EntityId) => JSX.Element,
): JSX.Element[] {
  const result = new Array<JSX.Element>()
  for (const id of iterateConnectedEntityIds(view)) {
    result.push(cb(id))
  }
  return result
}

function initBuildCursor({
  position,
  camera$,
  g,
  lines,
  view,
  shapes,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  g: SVGGElement
  lines: Record<string, SVGLineElement | null>
  view: BuildView
  shapes: World['shapes']
}): () => void {
  for (const id of iterateConnectedEntityIds(view)) {
    const entity = shapes[id]
    invariant(entity)
    const line = lines[id]
    invariant(line)
    line.setAttribute(
      'x2',
      `${entity.position.x.toFixed(4)}`,
    )
    line.setAttribute(
      'y2',
      `${entity.position.y.toFixed(4)}`,
    )
  }

  const sub = camera$.subscribe((camera) => {
    position.current = vec2.clone(camera.position)

    const x = position.current.x.toFixed(4)
    const y = position.current.y.toFixed(4)
    g.setAttribute('transform', `translate(${x} ${y})`)

    for (const id of iterateConnectedEntityIds(view)) {
      const line = lines[id]
      invariant(line)
      line.setAttribute('x1', x)
      line.setAttribute('y1', y)
    }
  })

  return () => {
    sub.unsubscribe()
  }
}

function initEditCursor({
  position,
  camera$,
  g,
  lines,
  view,
  shapes,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  g: SVGGElement
  lines: Record<string, SVGLineElement | null>
  view: EditView
  shapes: World['shapes']
}): () => void {
  for (const id of iterateConnectedEntityIds(view)) {
    const entity = shapes[id]
    invariant(entity)
    const line = lines[id]
    invariant(line)
    line.setAttribute(
      'x2',
      `${entity.position.x.toFixed(4)}`,
    )
    line.setAttribute(
      'y2',
      `${entity.position.y.toFixed(4)}`,
    )
  }

  const sub = camera$.subscribe((camera) => {
    position.current = vec2.clone(camera.position)

    const x = position.current.x.toFixed(4)
    const y = position.current.y.toFixed(4)
    g.setAttribute('transform', `translate(${x} ${y})`)

    for (const id of iterateConnectedEntityIds(view)) {
      const line = lines[id]
      invariant(line)
      line.setAttribute('x1', x)
      line.setAttribute('y1', y)
    }
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
  g,
  shapes,
  setWorld,
}: {
  position: MutableRefObject<Vec2>
  camera$: BehaviorSubject<Camera>
  g: SVGGElement
  shapes: World['shapes']
  setWorld: Updater<World>
}): () => void {
  function update(): void {
    const x = position.current.x.toFixed(4)
    const y = position.current.y.toFixed(4)
    g.setAttribute('transform', `translate(${x} ${y})`)
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
