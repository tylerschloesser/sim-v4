import React, {
  ForwardedRef,
  forwardRef,
  useContext,
  useRef,
  useState,
} from 'react'
import { AppContext } from './app-context.js'
import { getEntityColor } from './color.js'
import styles from './render-entity.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import { vec2 } from './vec2.js'
import { EntityId, EntityType, getEntity } from './world.js'

export interface RenderEntityProps {
  entityId: EntityId
  variant?: 'edit'
}

export function RenderEntity({
  entityId,
  variant,
}: RenderEntityProps) {
  const { world } = useContext(AppContext)
  const entity = getEntity(world, entityId)

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
}

const RenderCircle = React.memo(
  forwardRef(function RenderCircle(
    props: RenderCircleProps,
    ref: ForwardedRef<SVGCircleElement>,
  ) {
    // eslint-disable-next-line react/prop-types
    const { id, x, y, r, fill, stroke, opacity = 1 } = props
    return (
      <g data-group={`entity-${id}`}>
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
