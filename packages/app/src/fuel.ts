import invariant from 'tiny-invariant'
import { inventoryHas } from './inventory.js'
import {
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

  for (const peerId of Object.keys(shape.connections)) {
    const peer = world.states[peerId]
    invariant(peer)
    if (inventoryHas(peer.output, fuel)) {
      return {
        type: FuelSourceType.Inventory,
        inventory: peer.output,
      }
    }
  }

  return null
}
