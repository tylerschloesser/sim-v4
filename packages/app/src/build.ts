import { Vec2, vec2 } from './vec2.js'
import { World } from './world.js'

export function isBuildValid(
  position: Vec2,
  radius: 0.75,
  shapes: World['shapes'],
): boolean {
  for (const shape of Object.values(shapes)) {
    const v = vec2.clone(shape.position)
    vec2.sub(v, position)
    if (vec2.len(v) < radius + shape.radius) {
      return false
    }
  }
  return true
}
