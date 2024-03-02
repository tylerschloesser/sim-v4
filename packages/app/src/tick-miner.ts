import invariant from 'tiny-invariant'
import { deleteEmptyPatch } from './delete.js'
import { FuelSourceType, getFuelSource } from './fuel.js'
import { inventoryMove, inventorySub } from './inventory.js'
import {
  EntityType,
  ItemType,
  MinerEntityShape,
  MinerEntityState,
  World,
  getEntity,
} from './world.js'

export function tickMiner(
  world: World,
  shape: MinerEntityShape,
  state: MinerEntityState,
): void {
  const patch = (() => {
    for (const peerId of Object.keys(shape.connections)) {
      const peer = getEntity(world, peerId)
      if (peer.type === EntityType.enum.Patch) {
        return peer
      }
    }
    return null
  })()

  if (!patch) {
    state.mineTicksRemaining = null
    return
  }

  const itemType = (() => {
    const keys = Object.keys(patch.state.output)
    invariant(keys.length === 1)
    return ItemType.parse(keys.at(0))
  })()

  const item = { [itemType]: 1 }

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
      inventoryMove(patch.state.output, state.output, item)
      state.mineTicksRemaining = null

      const isPatchEmpty = (() => {
        const keys = Object.keys(patch.state.output)
        invariant(keys.length <= 1)
        return keys.length === 0
      })()

      if (isPatchEmpty) {
        deleteEmptyPatch(world, patch.id)
        return
      }
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }
  // prettier-ignore
  const fuelSource = getFuelSource(world, shape, state, fuel)
  if (state.mineTicksRemaining === null && fuelSource) {
    state.mineTicksRemaining = 10
  }

  if (state.mineTicksRemaining !== null && fuelSource) {
    switch (fuelSource.type) {
      case FuelSourceType.TicksRemaining: {
        break
      }
      case FuelSourceType.Inventory: {
        inventorySub(fuelSource.inventory, fuel)
        state.fuelTicksRemaining = 50
        break
      }
    }
  }
}
