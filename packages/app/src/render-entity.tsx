import React, {
  ForwardedRef,
  forwardRef,
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
    const state = useRef(
      new Map<
        string,
        {
          ref: SVGRectElement
          x: number
          y: number
        }
      >(),
    )

    useEffect(() => {
      let handle: number
      function render() {
        for (const value of state.current.values()) {
          value.x += 0.01
          value.ref.setAttribute(
            'transform',
            `translate(${value.x} ${value.y})`,
          )
        }

        handle = self.requestAnimationFrame(render)
      }
      handle = self.requestAnimationFrame(render)
      return () => {
        self.cancelAnimationFrame(handle)
      }
    }, [])

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

    return (
      <g data-group={`entity-${id}`}>
        <g data-group="debris">
          {[...debris].map((id) => (
            <rect
              x={x}
              y={y}
              width={r / 2}
              height={r / 2}
              fill="green"
              key={id}
              ref={(rect) => {
                if (rect) {
                  state.current.set(id, {
                    ref: rect,
                    x: 0,
                    y: 0,
                  })
                } else {
                  invariant(state.current.has(id))
                  state.current.delete(id)
                }
              }}
            ></rect>
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
