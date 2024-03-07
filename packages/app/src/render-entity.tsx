import React, { useContext } from 'react'
import { AppContext } from './app-context.js'
import { getEntityColor } from './color.js'
import { EntityId, getEntity } from './world.js'

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

  const { x, y } = entity.shape.position
  const r = entity.shape.radius
  const color = getEntityColor(entity)

  return (
    <RenderCircle
      id={entityId}
      x={x}
      y={y}
      r={r}
      fill={color.fill}
      stroke={color.stroke}
      opacity={variant === 'edit' ? 0.25 : undefined}
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

const RenderCircle = React.memo(function RenderCircle({
  id,
  x,
  y,
  r,
  fill,
  stroke,
  opacity = 1,
}: RenderCircleProps) {
  return (
    <g data-group={`entity-${id}`}>
      <circle
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
})
