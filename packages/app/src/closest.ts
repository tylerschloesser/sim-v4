import { Camera } from './camera.js'
import { vec2 } from './vec2.js'
import { Entity, World } from './world.js'

export function getClosestEntity(
  camera: Camera,
  entities: World['entities'],
): { entity: Entity; d: number } | null {
  let closest: Entity | null = null
  let min: number = Number.MAX_VALUE
  for (const entity of Object.values(entities)) {
    const v = vec2.clone(entity.position)
    vec2.sub(v, camera.position)
    const d = vec2.len(v)
    if (d < min) {
      min = d
      closest = entity
    }
  }
  if (closest === null) {
    return null
  }
  return { entity: closest, d: min }
}
