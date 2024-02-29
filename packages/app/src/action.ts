import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getCursorEntity } from './cursor.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
  inventoryAdd,
  inventorySub,
} from './inventory.js'
import { entityRecipes, smelterRecipes } from './recipe.js'
import { Vec2 } from './vec2.js'
import {
  EntityType,
  Inventory,
  ItemType,
  SmelterEntity,
  World,
} from './world.js'

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

export function minePatch(setWorld: Updater<World>): void {
  setWorld((draft) => {
    invariant(draft.cursor.entityId)
    const entity = draft.entities[draft.cursor.entityId]

    invariant(entity?.type === EntityType.enum.Patch)

    const patchInventory =
      draft.inventories[entity.inventoryId]
    invariant(patchInventory)

    const cursorInventory =
      draft.inventories[draft.cursor.inventoryId]
    invariant(cursorInventory)

    const { itemType } = entity

    const patchCount = patchInventory.items[itemType]
    invariant(
      typeof patchCount === 'number' && patchCount >= 1,
    )
    patchInventory.items[itemType] = patchCount - 1

    if (patchCount === 1) {
      delete draft.entities[entity.id]
      delete draft.inventories[entity.inventoryId]
      draft.cursor.entityId = null
    }

    const cursorCount = cursorInventory.items[itemType]
    cursorInventory.items[itemType] = (cursorCount ?? 0) + 1
  })
}

export function moveItemFromCursorToSmelter(
  setWorld: Updater<World>,
  itemType: ItemType,
): void {
  setWorld((draft) => {
    const cursorInventory = getCursorInventory(
      draft.cursor,
      draft.inventories,
    )
    const entity = getCursorEntity(
      draft.cursor,
      draft.entities,
    )
    invariant(entity?.type === EntityType.enum.Smelter)
    const entityInventory = getEntityInventory(
      entity,
      draft.inventories,
    )
    const items = { [itemType]: 1 }
    inventorySub(cursorInventory, items)
    inventoryAdd(entityInventory, items)
  })
}

export function buildSmelter(
  setWorld: Updater<World>,
  position: Vec2,
): void {
  const recipe = entityRecipes[EntityType.enum.Smelter]
  invariant(recipe)

  setWorld((draft) => {
    const cursorInventory = getCursorInventory(
      draft.cursor,
      draft.inventories,
    )

    for (const [key, value] of Object.entries(
      recipe.input,
    )) {
      const itemType = ItemType.parse(key)
      let count = cursorInventory.items[itemType]
      invariant(typeof count === 'number' && count >= value)
      count -= value
      if (count === 0) {
        delete cursorInventory.items[itemType]
      } else {
        cursorInventory.items[itemType] = count
      }
    }

    invariant(recipe.output === EntityType.enum.Smelter)

    const entityId = `${draft.nextEntityId++}`

    const inventory: Inventory = {
      id: `${draft.nextInventoryId++}`,
      items: {},
    }
    invariant(!draft.inventories[inventory.id])
    draft.inventories[inventory.id] = inventory

    const entity: SmelterEntity = {
      type: recipe.output,
      id: entityId,
      inventoryId: inventory.id,
      position,
      radius: 0.75,
      recipeId: null,
      smeltTicksRemaining: null,
      fuelTicksRemaining: null,
    }

    invariant(!draft.entities[entity.id])
    draft.entities[entity.id] = entity
  })
}
