import { Updater } from 'use-immer'
import { tickSmelter } from './tick-smelter.js'
import { EntityType, World } from './world.js'

// eslint-disable-next-line
export function tickWorld(setWorld: Updater<World>): void {
  setWorld((world) => {
    world.tick += 1

    for (const entity of Object.values(world.entities)) {
      switch (entity.type) {
        case EntityType.enum.Smelter:
          tickSmelter(world, entity)
          break
      }
    }
  })
}
