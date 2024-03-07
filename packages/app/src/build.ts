import invariant from 'tiny-invariant'
import { Vec2, vec2 } from './vec2.js'
import { EntityShape, World } from './world.js'

export function isBuildValid(
  position: Vec2,
  radius: 0.75,
  shapes: World['shapes'],
): boolean {
  for (const shape of Object.values(shapes)) {
    const dist = vec2.dist(position, shape.position)
    if (dist < radius + shape.radius) {
      return false
    }
  }
  return true
}

export function isEditValid(
  position: Vec2,
  shape: EntityShape,
  shapes: World['shapes'],
): boolean {
  invariant(shapes[shape.id])
  for (const peer of Object.values(shapes)) {
    if (peer.id === shape.id) {
      continue
    }
    const dist = vec2.dist(peer.position, position)
    if (dist < peer.radius + shape.radius) {
      return false
    }
  }
  return true
}
