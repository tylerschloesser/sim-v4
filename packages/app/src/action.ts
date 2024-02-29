import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
  inventoryAdd,
  inventorySub,
} from './inventory.js'
import { smelterRecipes } from './recipe.js'
import { EntityType, World } from './world.js'

export function takeAllFromSmelter(
  setWorld: Updater<World>,
): void {
  setWorld((world) => {
    const cursorInventory = getCursorInventory(
      world.cursor,
      world.inventories,
    )

    invariant(world.cursor.entityId)
    const entity = getEntity(
      world.entities,
      world.cursor.entityId,
    )
    invariant(entity.type === EntityType.enum.Smelter)

    const entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )

    invariant(entity.recipeId)
    const recipe = smelterRecipes[entity.recipeId]
    invariant(recipe)
    const itemType = recipe.output

    const count = entityInventory.items[itemType]
    invariant(typeof count === 'number' && count > 0)
    const items = { [itemType]: count }
    inventorySub(entityInventory, items)
    inventoryAdd(cursorInventory, items)

    if (entity.smeltTicksRemaining === null) {
      entity.recipeId = null
    }
  })
}
