import invariant from 'tiny-invariant'
import { World } from './world.js'

// TODO ensure every entity input is the closest output
export function validateWorld(world: World): void {
  for (const shape of Object.values(world.shapes)) {
    for (const value of Object.values(shape.input)) {
      const inputCount = Object.keys(value).length
      invariant(inputCount === 0 || inputCount === 1)
    }
  }
}
