import invariant from 'tiny-invariant'
import { deleteEmptyPatch } from './delete.js'
import {
  inventoryHas,
  inventoryMove,
  inventorySub,
} from './inventory.js'
import {
  EntityId,
  EntityType,
  Inventory,
  ItemType,
  MinerEntityShape,
  MinerEntityState,
  World,
  getEntity,
} from './world.js'

enum FuelSourceType {
  TicksRemaining = 'TicksRemaining',
  Inventory = 'Inventory',
  Connection = 'Connection',
}
interface TicksRemainingFuelSource {
  type: FuelSourceType.TicksRemaining
}
interface InventoryFuelSource {
  type: FuelSourceType.Inventory
  inventory: Inventory
}
interface ConnectionFuelSource {
  type: FuelSourceType.Connection
  entityId: EntityId
}
type FuelSource =
  | TicksRemainingFuelSource
  | InventoryFuelSource
  | ConnectionFuelSource

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
  const fuelSource = getFuelSource(
    world,
    shape,
    state,
    fuel,
  )
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
      case FuelSourceType.Connection: {
        const peer = world.states[fuelSource.entityId]
        invariant(peer)
        inventorySub(peer.output, fuel)
        state.fuelTicksRemaining = 50
        break
      }
    }
  }
}

function getFuelSource(
  world: World,
  shape: MinerEntityShape,
  state: MinerEntityState,
  fuel: Inventory,
): FuelSource | null {
  if (
    state.fuelTicksRemaining &&
    state.fuelTicksRemaining > 0
  ) {
    return { type: FuelSourceType.TicksRemaining }
  }

  if (inventoryHas(state.input, fuel)) {
    return {
      type: FuelSourceType.Inventory,
      inventory: state.input,
    }
  }

  // special case for miners, allow miners to consume coal they mine
  if (inventoryHas(state.output, fuel)) {
    return {
      type: FuelSourceType.Inventory,
      inventory: state.input,
    }
  }

  for (const peerId of Object.keys(shape.connections)) {
    const peer = world.states[peerId]
    invariant(peer)
    if (inventoryHas(peer.output, fuel)) {
      return {
        type: FuelSourceType.Connection,
        entityId: peerId,
      }
    }
  }

  return null
}
