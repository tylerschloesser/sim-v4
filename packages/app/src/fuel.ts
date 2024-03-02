import invariant from 'tiny-invariant'
import { inventoryHas } from './inventory.js'
import {
  EntityType,
  Inventory,
  MinerEntityShape,
  MinerEntityState,
  SmelterEntityShape,
  SmelterEntityState,
  World,
} from './world.js'

export enum FuelSourceType {
  TicksRemaining = 'TicksRemaining',
  Inventory = 'Inventory',
}

export interface TicksRemainingFuelSource {
  type: FuelSourceType.TicksRemaining
}

export interface InventoryFuelSource {
  type: FuelSourceType.Inventory
  inventory: Inventory
}

export type FuelSource =
  | TicksRemainingFuelSource
  | InventoryFuelSource

export function getFuelSource(
  world: World,
  shape: MinerEntityShape | SmelterEntityShape,
  state: MinerEntityState | SmelterEntityState,
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
  if (
    state.type === EntityType.enum.Miner &&
    inventoryHas(state.output, fuel)
  ) {
    return {
      type: FuelSourceType.Inventory,
      inventory: state.output,
    }
  }

  for (const peerId of Object.keys(shape.connections)) {
    const peerShape = world.shapes[peerId]
    invariant(peerShape)
    if (peerShape.type === EntityType.enum.Patch) {
      continue
    }
    const peerState = world.states[peerId]
    invariant(peerState)
    if (inventoryHas(peerState.output, fuel)) {
      return {
        type: FuelSourceType.Inventory,
        inventory: peerState.output,
      }
    }
  }

  return null
}
