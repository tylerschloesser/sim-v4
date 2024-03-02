import invariant from 'tiny-invariant'
import { FuelSourceType, getFuelSource } from './fuel.js'
import {
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { SmelterRecipe, smelterRecipes } from './recipe.js'
import {
  Inventory,
  ItemType,
  SmelterEntityShape,
  SmelterEntityState,
  World,
} from './world.js'

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
      const inputSource = getRecipeInputSource(
        world,
        shape,
        state,
        recipe,
      )
      if (inputSource) {
        inventorySub(inputSource, recipe.input)
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
    }
  }
}

function getRecipeInputSource(
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
