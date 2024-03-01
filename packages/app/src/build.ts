import { Vec2, vec2 } from './vec2.js'
import { World } from './world.js'

export function isBuildValid(
  position: Vec2,
  radius: 0.75,
  entities: World['entities'],
): boolean {
  for (const entity of Object.values(entities)) {
    const v = vec2.clone(entity.position)
    vec2.sub(v, position)
    if (vec2.len(v) < radius + entity.radius) {
      return false
    }
  }
  return true
}
