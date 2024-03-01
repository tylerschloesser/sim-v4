import React from 'react'
import { Entity } from './world.js'

export interface RenderEntityConnectionProps {
  a: Entity
  b: Entity
}

export const RenderEntityConnection = React.memo(
  function RenderEntityConnection({
    a,
    b,
  }: RenderEntityConnectionProps) {
    return <>TODO</>
  },
)
