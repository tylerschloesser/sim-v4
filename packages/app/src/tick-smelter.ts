import invariant from 'tiny-invariant'
import {
  getEntityInventory,
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { smelterRecipes } from './recipe.js'
import {
  ItemType,
  SmelterEntity,
  SmelterEntityState,
  World,
} from './world.js'

export function tickSmelter(
  world: World,
  entity: SmelterEntity,
  state: SmelterEntityState,
): void {
  const inventory = getEntityInventory(
    entity,
    world.inventories,
  )

  if (
    state.fuelTicksRemaining !== null &&
    state.smeltTicksRemaining !== null
  ) {
    invariant(state.fuelTicksRemaining > 0)
    invariant(state.smeltTicksRemaining > 0)

    invariant(state.recipeId)
    const recipe = smelterRecipes[state.recipeId]
    invariant(recipe)

    state.fuelTicksRemaining -= 1
    state.smeltTicksRemaining -= 1

    if (state.fuelTicksRemaining === 0) {
      state.fuelTicksRemaining = null
    }

    if (state.smeltTicksRemaining === 0) {
      inventoryAdd(inventory, {
        [recipe.output]: 1,
      })
      state.smeltTicksRemaining = null
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }

  if (
    state.fuelTicksRemaining === null &&
    state.smeltTicksRemaining !== null
  ) {
    if (inventoryHas(inventory, fuel)) {
      inventorySub(inventory, fuel)
      state.fuelTicksRemaining = 50
    }
  }

  if (
    state.smeltTicksRemaining === null &&
    (state.fuelTicksRemaining ||
      inventoryHas(inventory, fuel))
  ) {
    if (!state.recipeId) {
      for (const recipe of Object.values(smelterRecipes)) {
        if (inventoryHas(inventory, recipe.input)) {
          state.recipeId = recipe.id
          break
        }
      }
    }

    if (state.recipeId) {
      const recipe = smelterRecipes[state.recipeId]
      invariant(recipe)

      if (inventoryHas(inventory, recipe.input)) {
        if (state.fuelTicksRemaining === null) {
          inventorySub(inventory, fuel)
          state.fuelTicksRemaining = 50
        }

        inventorySub(inventory, recipe.input)
        state.smeltTicksRemaining = 10
      }
    }
  }

  if (
    state.recipeId &&
    state.smeltTicksRemaining === null
  ) {
    const recipe = smelterRecipes[state.recipeId]
    invariant(recipe)

    if (!inventory.items[recipe.output]) {
      state.recipeId = null
    }
  }
}
