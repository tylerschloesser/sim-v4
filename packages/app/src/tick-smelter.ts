import invariant from 'tiny-invariant'
import {
  getCursorInventory,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import { smelterRecipes } from './recipe.js'
import { ItemType, SmelterEntity, World } from './world.js'

export function tickSmelter(
  world: World,
  entity: SmelterEntity,
): void {
  if (world.cursor.entityId === entity.id) {
    const cursorInventory = getCursorInventory(
      world.cursor,
      world.inventories,
    )

    if (entity.fuelTicksRemaining === null) {
      let coalCount =
        cursorInventory.items[ItemType.enum.Coal] ?? 0
      if (coalCount >= 1) {
        coalCount -= 1
        entity.fuelTicksRemaining = 50
        if (coalCount === 0) {
          delete cursorInventory.items[ItemType.enum.Coal]
        } else {
          cursorInventory.items[ItemType.enum.Coal] =
            coalCount
        }
      }
    }

    if (entity.smeltTicksRemaining === null) {
      if (entity.recipeId === null) {
        for (const recipe of Object.values(
          smelterRecipes,
        )) {
          if (inventoryHas(cursorInventory, recipe.input)) {
            entity.recipeId = recipe.id
            break
          }
        }
      }

      if (entity.recipeId) {
        const recipe = smelterRecipes[entity.recipeId]
        invariant(recipe)

        if (inventoryHas(cursorInventory, recipe.input)) {
          inventorySub(cursorInventory, recipe.input)
          entity.smeltTicksRemaining = 10
        }
      }
    }
  }

  if (
    entity.fuelTicksRemaining === null ||
    entity.smeltTicksRemaining === null
  ) {
    return
  }

  invariant(entity.recipeId)

  const recipe = smelterRecipes[entity.recipeId]
  invariant(recipe)

  invariant(entity.fuelTicksRemaining > 0)
  invariant(entity.smeltTicksRemaining > 0)
}
