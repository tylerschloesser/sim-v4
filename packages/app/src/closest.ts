import { Camera } from './camera.js'
import { vec2 } from './vec2.js'
import { Patch, World } from './world.js'

export function getClosestPatch(
  camera: Camera,
  patches: World['patches'],
): { patch: Patch; d: number } | null {
  let closest: Patch | null = null
  let min: number = Number.MAX_VALUE
  for (const patch of Object.values(patches)) {
    const v = vec2.clone(patch.position)
    vec2.sub(v, camera.position)
    const d = vec2.len(v)
    if (d < min) {
      min = d
      closest = patch
    }
  }
  if (closest === null) {
    return null
  }
  return { patch: closest, d: min }
}
