import invariant from 'tiny-invariant'
import { World } from './world.js'

export function validateWorld(world: World): void {
  for (const shape of Object.values(world.shapes)) {
    const inputCount = Object.keys(shape.input).length
    invariant(inputCount === 0 || inputCount === 1)
  }
}
