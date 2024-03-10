import { Camera } from './camera.js'
import { EntityShape, World } from './types.js'
import { vec2 } from './vec2.js'

export function getClosestShape(
  camera: Camera,
  shapes: World['shapes'],
): { shape: EntityShape; d: number } | null {
  let closest: EntityShape | null = null
  let min: number = Number.MAX_VALUE
  for (const shape of Object.values(shapes)) {
    const v = vec2.clone(shape.position)
    vec2.sub(v, camera.position)
    const d = vec2.len(v)
    if (d < min) {
      min = d
      closest = shape
    }
  }
  if (closest === null) {
    return null
  }
  return { shape: closest, d: min }
}
