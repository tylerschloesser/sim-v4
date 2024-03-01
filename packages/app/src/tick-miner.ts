import invariant from 'tiny-invariant'
import {
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import {
  EntityType,
  ItemType,
  MinerEntity,
  MinerEntityState,
  World,
} from './world.js'

export function tickMiner(
  world: World,
  entity: MinerEntity,
  state: MinerEntityState,
): void {
  if (!entity.patchId) {
    state.mineTicksRemaining = null
    return
  }

  const entityInventory =
    world.inventories[entity.inventoryId]
  invariant(entityInventory)

  const patch = world.entities[entity.patchId]
  invariant(patch?.type === EntityType.enum.Patch)

  const item = { [patch.itemType]: 1 }

  const patchInventory =
    world.inventories[patch.inventoryId]
  invariant(patchInventory)
  invariant(inventoryHas(patchInventory, item))

  if (
    state.fuelTicksRemaining !== null &&
    state.mineTicksRemaining !== null
  ) {
    invariant(state.fuelTicksRemaining > 0)
    invariant(state.mineTicksRemaining > 0)

    state.fuelTicksRemaining -= 1
    state.mineTicksRemaining -= 1

    if (state.fuelTicksRemaining === 0) {
      state.fuelTicksRemaining = null
    }

    if (state.mineTicksRemaining === 0) {
      inventoryAdd(entityInventory, item)
      inventorySub(patchInventory, item)
      state.mineTicksRemaining = null

      if (!inventoryHas(patchInventory, item)) {
        delete world.entities[patch.id]
        delete world.inventories[patch.id]
        for (const minerId of Object.keys(patch.minerIds)) {
          const miner = world.entities[minerId]
          invariant(miner?.type === EntityType.enum.Miner)
          miner.patchId = null
        }
        if (world.cursor.entityId === patch.id) {
          world.cursor.entityId = null
        }
        return
      }
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }

  if (
    state.fuelTicksRemaining === null &&
    state.mineTicksRemaining !== null
  ) {
    if (inventoryHas(entityInventory, fuel)) {
      inventorySub(entityInventory, fuel)
      state.fuelTicksRemaining = 50
    }
  }

  if (
    state.mineTicksRemaining === null &&
    (state.fuelTicksRemaining ||
      inventoryHas(entityInventory, fuel))
  ) {
    if (state.fuelTicksRemaining === null) {
      inventorySub(entityInventory, fuel)
      state.fuelTicksRemaining = 50
    }

    state.mineTicksRemaining = 10
  }
}
