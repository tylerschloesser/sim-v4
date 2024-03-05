import { Updater } from 'use-immer'
import { World } from './world.js'

export function tickWorld(setWorld: Updater<World>): void {
  setWorld((world) => {
    world.tick += 1
  })
}
