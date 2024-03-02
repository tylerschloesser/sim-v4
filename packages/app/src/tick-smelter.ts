import invariant from 'tiny-invariant'
import {
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { smelterRecipes } from './recipe.js'
import {
  ItemType,
  SmelterEntityShape,
  SmelterEntityState,
  World,
} from './world.js'

export function tickSmelter(
  _world: World,
  _shape: SmelterEntityShape,
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
      state.recipeId = null
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }
  const hasFuel =
    state.fuelTicksRemaining ||
    inventoryHas(state.input, fuel)

  if (state.smeltTicksRemaining === null && hasFuel) {
    invariant(state.recipeId === null)

    for (const [recipeId, recipe] of Object.entries(
      smelterRecipes,
    )) {
      if (inventoryHas(state.input, recipe.input)) {
        state.recipeId = recipeId
        inventorySub(state.input, recipe.input)
        state.smeltTicksRemaining = 10
        break
      }
    }
  }

  if (
    state.smeltTicksRemaining !== null &&
    state.fuelTicksRemaining === null &&
    hasFuel
  ) {
    inventorySub(state.input, fuel)
    state.fuelTicksRemaining = 50
  }
}
