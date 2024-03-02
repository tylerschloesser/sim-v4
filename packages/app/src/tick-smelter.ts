import invariant from 'tiny-invariant'
import {
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { SmelterRecipe, smelterRecipes } from './recipe.js'
import {
  EntityId,
  Inventory,
  ItemType,
  SmelterEntityShape,
  SmelterEntityState,
  World,
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

export function tickSmelter(
  world: World,
  shape: SmelterEntityShape,
  state: SmelterEntityState,
): void {
  if (
    state.fuelTicksRemaining !== null &&
    state.smeltTicksRemaining !== null
  ) {
    invariant(state.fuelTicksRemaining > 0)
    invariant(state.smeltTicksRemaining > 0)
    invariant(state.recipeId)

    state.fuelTicksRemaining -= 1
    state.smeltTicksRemaining -= 1

    if (state.fuelTicksRemaining === 0) {
      state.fuelTicksRemaining = null
    }

    if (state.smeltTicksRemaining === 0) {
      const recipe = smelterRecipes[state.recipeId]
      invariant(recipe)
      inventoryAdd(state.output, recipe.output)
      state.smeltTicksRemaining = null
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }
  // prettier-ignore
  const fuelSource = getFuelSource(world, shape, state, fuel)

  if (state.smeltTicksRemaining === null && fuelSource) {
    const recipeIds = new Set<keyof typeof smelterRecipes>()
    if (state.recipeId) {
      recipeIds.add(state.recipeId)
    }
    for (const recipeId of Object.keys(smelterRecipes)) {
      recipeIds.add(recipeId)
    }

    for (const recipeId of recipeIds) {
      const recipe = smelterRecipes[recipeId]
      invariant(recipe)
      const source = getRecipeInventory(
        world,
        shape,
        state,
        recipe,
      )
      if (source) {
        inventorySub(source, recipe.input)
        state.smeltTicksRemaining = 10
        state.recipeId = recipeId
        break
      }
    }

    // TODO clean this up
    if (state.smeltTicksRemaining === null) {
      state.recipeId = null
    }
  }

  if (state.smeltTicksRemaining !== null && fuelSource) {
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

function getRecipeInventory(
  world: World,
  shape: SmelterEntityShape,
  state: SmelterEntityState,
  recipe: SmelterRecipe,
): Inventory | null {
  if (inventoryHas(state.input, recipe.input)) {
    return state.input
  }

  for (const peerId of Object.keys(shape.connections)) {
    const peer = world.states[peerId]
    invariant(peer)
    if (inventoryHas(peer.output, recipe.input)) {
      return peer.output
    }
  }

  return null
}

function getFuelSource(
  world: World,
  shape: SmelterEntityShape,
  state: SmelterEntityState,
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
        type: FuelSourceType.Connection,
        entityId: peerId,
      }
    }
  }

  return null
}
