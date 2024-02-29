import { Updater } from 'use-immer'
import { World } from './world.js'

// eslint-disable-next-line
export function tickWorld(_setWorld: Updater<World>): void {
  console.log('todo tick world')
}
