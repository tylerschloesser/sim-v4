import { clamp, random } from 'lodash-es'
import React, {
  ForwardedRef,
  MutableRefObject,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Observable } from 'rxjs'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext } from './app-context.js'
import { getEntityColor } from './color.js'
import { radiansToDegrees } from './math.js'
import styles from './render-entity.module.scss'
import { EntityId, EntityType } from './types.js'
import { useCameraEffect } from './use-camera-effect.js'
import { vec2 } from './vec2.js'
import { getEntity } from './world.js'

export interface RenderEntityProps {
  entityId: EntityId
  variant?: 'edit'
  debris$: Observable<EntityId>
}

export function RenderEntity({
  entityId,
  variant,
  debris$,
}: RenderEntityProps) {
  const { world } = useContext(AppContext)
  const entity = getEntity(world, entityId)

  const state = useRef(
    new Map<string, { timeout: number }>(),
  )
  const [debris, setDebris] = useImmer(new Set<string>())

  useEffect(() => {
    const sub = debris$.subscribe((debrisEntityId) => {
      if (entityId === debrisEntityId) {
        const id = `${self.performance.now()}`
        setDebris((prev) => {
          prev.add(id)
        })
        invariant(!state.current.has(id))
        state.current.set(id, {
          timeout: self.setTimeout(() => {
            state.current.delete(id)
            setDebris((prev) => {
              prev.delete(id)
            })
          }, 1000),
        })
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [debris$])

  useEffect(() => {
    for (const value of state.current.values()) {
      self.clearTimeout(value.timeout)
    }
  }, [])

  const ref = useRef<SVGCircleElement>(null)

  const [transparent, setTransparent] = useState(false)

  const { x, y } = entity.shape.position
  const r = entity.shape.radius
  const color = getEntityColor(entity)

  useCameraEffect((camera) => {
    if (entity.type !== EntityType.enum.Patch) {
      return
    }

    const dist = vec2.dist(
      camera.position,
      entity.shape.position,
    )
    setTransparent(
      dist < entity.shape.radius + world.cursor.radius,
    )
  }, [])

  let opacity = variant === 'edit' ? 0.25 : undefined
  if (transparent) {
    opacity = 0.25
  }

  return (
    <RenderCircle
      ref={ref}
      id={entityId}
      x={x}
      y={y}
      r={r}
      fill={color.fill}
      stroke={color.stroke}
      opacity={opacity}
      debris={debris}
    />
  )
}

interface DebrisState {
  ref: SVGRectElement
  x: number
  y: number
  vx: number
  vy: number
  w: number
  vw: number
  o: number
  vo: number
}

interface DebrisProps {
  id: string
  x: number
  y: number
  r: number
  state: MutableRefObject<Map<string, DebrisState>>
}
const Debris = React.memo(function Debris(
  props: DebrisProps,
) {
  // eslint-disable-next-line
  const { id, x, y, r, state } = props

  const ref = useCallback((rect: SVGRectElement | null) => {
    if (rect) {
      const now = self.performance.now()
      const angle = ((now % 1000) / 1000) * Math.PI * 2

      const v = vec2.init(6, 0)
      vec2.rotate(v, angle)
      const { x: vx, y: vy } = v
      const vw = random(0.5, 2, true) * Math.PI * 2
      const vo = -1
      state.current.set(id, {
        ref: rect,
        x: 0,
        y: 0,
        vx,
        vy,
        w: 0,
        vw,
        o: 1,
        vo,
      })
    } else {
      // invariant(state.current.has(id))
      state.current.delete(id)
    }
  }, [])

  return (
    <rect
      x={x - r / 8}
      y={y - r / 8}
      width={r / 4}
      height={r / 4}
      fill="green"
      key={id}
      ref={ref}
    ></rect>
  )
})

interface RenderCircleProps {
  id: string
  x: number
  y: number
  r: number
  fill: string
  stroke?: string
  opacity?: number
  debris: Set<string>
}

const RenderCircle = React.memo(
  forwardRef(function RenderCircle(
    props: RenderCircleProps,
    ref: ForwardedRef<SVGCircleElement>,
  ) {
    /* eslint-disable react/prop-types */
    const {
      id,
      x,
      y,
      r,
      fill,
      stroke,
      opacity = 1,
      debris,
    } = props
    /* eslint-enable react/prop-types */

    const state = useRef(new Map<string, DebrisState>())

    useEffect(() => {
      let handle: number
      let last = self.performance.now()
      function render() {
        const now = self.performance.now()
        const elapsed = (now - last) / 1000
        last = now
        for (const value of state.current.values()) {
          value.x += value.vx * elapsed
          value.y += value.vy * elapsed
          value.w += value.vw * elapsed
          value.ref.setAttribute(
            'transform',
            `translate(${value.x} ${value.y}) rotate(${radiansToDegrees(value.w)} ${x} ${y})`,
          )
          value.o += value.vo * elapsed
          value.ref.setAttribute(
            'opacity',
            `${clamp(value.o, 0, 1)}`,
          )
        }

        handle = self.requestAnimationFrame(render)
      }
      handle = self.requestAnimationFrame(render)
      return () => {
        self.cancelAnimationFrame(handle)
      }
    }, [])

    return (
      <g data-group={`entity-${id}`}>
        <g data-group="debris">
          {[...debris].map((debrisId) => (
            <Debris
              id={debrisId}
              x={x}
              y={y}
              r={r}
              state={state}
              key={debrisId}
            />
          ))}
        </g>
        <circle
          className={styles.circle}
          ref={ref}
          cx={x}
          cy={y}
          r={r}
          fill={fill}
          stroke={stroke}
          // TODO set this based on viewport
          strokeWidth=".05px"
          opacity={opacity}
        />
      </g>
    )
  }),
)
