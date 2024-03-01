import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { tickMiner } from './tick-miner.js'
import { tickSmelter } from './tick-smelter.js'
import { EntityType, World } from './world.js'

export function tickWorld(setWorld: Updater<World>): void {
  setWorld((world) => {
    world.tick += 1

    for (const entity of Object.values(world.entities)) {
      const state = world.states[entity.id]
      switch (entity.type) {
        case EntityType.enum.Smelter:
          invariant(state?.type === EntityType.enum.Smelter)
          tickSmelter(world, entity, state)
          break
        case EntityType.enum.Miner:
          invariant(state?.type === EntityType.enum.Miner)
          tickMiner(world, entity, state)
          break
      }
    }
  })
}
