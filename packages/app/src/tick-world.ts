import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { tickMiner } from './tick-miner.js'
import { tickSmelter } from './tick-smelter.js'
import { EntityType, World } from './world.js'

export function tickWorld(setWorld: Updater<World>): void {
  setWorld((world) => {
    world.tick += 1

    for (const shape of Object.values(world.shapes)) {
      const state = world.states[shape.id]
      switch (shape.type) {
        case EntityType.enum.Smelter:
          invariant(state?.type === EntityType.enum.Smelter)
          tickSmelter(world, shape, state)
          break
        case EntityType.enum.Miner:
          invariant(state?.type === EntityType.enum.Miner)
          tickMiner(world, shape, state)
          break
      }
    }
  })
}
