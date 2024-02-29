import invariant from 'tiny-invariant'
import {
  getEntityInventory,
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { smelterRecipes } from './recipe.js'
import { ItemType, SmelterEntity, World } from './world.js'

export function tickSmelter(
  world: World,
  entity: SmelterEntity,
): void {
  const inventory = getEntityInventory(
    entity,
    world.inventories,
  )

  if (
    entity.fuelTicksRemaining !== null &&
    entity.smeltTicksRemaining !== null
  ) {
    invariant(entity.fuelTicksRemaining > 0)
    invariant(entity.smeltTicksRemaining > 0)

    invariant(entity.recipeId)
    const recipe = smelterRecipes[entity.recipeId]
    invariant(recipe)

    entity.fuelTicksRemaining -= 1
    entity.smeltTicksRemaining -= 1

    if (entity.fuelTicksRemaining === 0) {
      entity.fuelTicksRemaining = null
    }

    if (entity.smeltTicksRemaining === 0) {
      inventoryAdd(inventory, {
        [recipe.output]: 1,
      })
      entity.smeltTicksRemaining = null
    }
  }

  const fuel = { [ItemType.enum.Coal]: 1 }

  if (
    entity.fuelTicksRemaining === null &&
    entity.smeltTicksRemaining !== null
  ) {
    if (inventoryHas(inventory, fuel)) {
      inventorySub(inventory, fuel)
      entity.fuelTicksRemaining = 50
    }
  }

  if (
    entity.smeltTicksRemaining === null &&
    (entity.fuelTicksRemaining ||
      inventoryHas(inventory, fuel))
  ) {
    if (!entity.recipeId) {
      for (const recipe of Object.values(smelterRecipes)) {
        if (inventoryHas(inventory, recipe.input)) {
          entity.recipeId = recipe.id
          break
        }
      }
    }

    if (entity.recipeId) {
      const recipe = smelterRecipes[entity.recipeId]
      invariant(recipe)

      if (inventoryHas(inventory, recipe.input)) {
        if (entity.fuelTicksRemaining === null) {
          inventorySub(inventory, fuel)
          entity.fuelTicksRemaining = 50
        }

        inventorySub(inventory, recipe.input)
        entity.smeltTicksRemaining = 10
      }
    }
  }

  if (
    entity.smeltTicksRemaining === null &&
    entity.recipeId
  ) {
    entity.recipeId = null
  }
}
