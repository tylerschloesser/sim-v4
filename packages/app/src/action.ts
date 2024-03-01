import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getCursorEntity } from './cursor.js'
import { deleteEmptyPatch } from './delete.js'
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
  MinerEntity,
  MinerEntityState,
  SmelterEntity,
  SmelterEntityState,
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

    const state = world.states[entity.id]
    invariant(state?.type === EntityType.enum.Smelter)

    const entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )

    invariant(state.recipeId)
    const recipe = smelterRecipes[state.recipeId]
    invariant(recipe)
    const itemType = recipe.output

    const count = entityInventory.items[itemType]
    invariant(typeof count === 'number' && count > 0)
    const items = { [itemType]: count }
    inventorySub(entityInventory, items)
    inventoryAdd(cursorInventory, items)

    if (state.smeltTicksRemaining === null) {
      state.recipeId = null
    }
  })
}

export function takeAllFromMiner(
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
    invariant(entity.type === EntityType.enum.Miner)

    const entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )

    const { itemType } = entity
    const count = entityInventory.items[itemType]
    invariant(typeof count === 'number' && count > 0)
    const items = { [itemType]: count }
    inventorySub(entityInventory, items)
    inventoryAdd(cursorInventory, items)
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

    let patchCount = patchInventory.items[itemType]
    invariant(
      typeof patchCount === 'number' && patchCount >= 1,
    )
    patchCount -= 1
    patchInventory.items[itemType] = patchCount

    if (patchCount === 0) {
      deleteEmptyPatch(draft, entity.id)
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

export function moveItemFromCursorToMiner(
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
    invariant(entity?.type === EntityType.enum.Miner)
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
  invariant(recipe?.output === EntityType.enum.Smelter)

  setWorld((draft) => {
    const cursorInventory = getCursorInventory(
      draft.cursor,
      draft.inventories,
    )
    inventorySub(cursorInventory, recipe.input)

    const entityId = `${draft.nextEntityId++}`

    const inventory: Inventory = {
      id: `${draft.nextInventoryId++}`,
      items: {},
    }
    invariant(!draft.inventories[inventory.id])
    draft.inventories[inventory.id] = inventory

    const entity: SmelterEntity = {
      type: EntityType.enum.Smelter,
      id: entityId,
      inventoryId: inventory.id,
      position,
      radius: 0.75,
    }

    invariant(!draft.entities[entity.id])
    draft.entities[entity.id] = entity

    const state: SmelterEntityState = {
      type: EntityType.enum.Smelter,
      id: entityId,
      recipeId: null,
      smeltTicksRemaining: null,
      fuelTicksRemaining: null,
    }
    invariant(!draft.states[state.id])
    draft.states[state.id] = state
  })
}

export function buildMiner(
  setWorld: Updater<World>,
  position: Vec2,
  patchId: string,
): void {
  const recipe = entityRecipes[EntityType.enum.Miner]
  invariant(recipe?.output === EntityType.enum.Miner)

  setWorld((draft) => {
    const cursorInventory = getCursorInventory(
      draft.cursor,
      draft.inventories,
    )
    inventorySub(cursorInventory, recipe.input)

    const entityId = `${draft.nextEntityId++}`

    const inventory: Inventory = {
      id: `${draft.nextInventoryId++}`,
      items: {},
    }
    invariant(!draft.inventories[inventory.id])
    draft.inventories[inventory.id] = inventory

    const patch = draft.entities[patchId]
    invariant(patch?.type === EntityType.enum.Patch)
    invariant(!patch.minerIds[entityId])
    patch.minerIds[entityId] = true

    const entity: MinerEntity = {
      type: EntityType.enum.Miner,
      id: entityId,
      inventoryId: inventory.id,
      position,
      radius: 0.75,
      patchId,
      itemType: patch.itemType,
    }

    invariant(!draft.entities[entity.id])
    draft.entities[entity.id] = entity

    const state: MinerEntityState = {
      type: EntityType.enum.Miner,
      id: entityId,
      fuelTicksRemaining: null,
      mineTicksRemaining: null,
    }
    invariant(!draft.states[state.id])
    draft.states[state.id] = state
  })
}

export function connectMinerToPatch(
  setWorld: Updater<World>,
  minerId: string,
): void {
  setWorld((draft) => {
    const miner = draft.entities[minerId]
    invariant(miner?.type === EntityType.enum.Miner)
    invariant(miner.patchId === null)

    // get patch from cursor
    const patchId = draft.cursor.entityId
    invariant(patchId)
    const patch = draft.entities[patchId]
    invariant(patch?.type === EntityType.enum.Patch)
    invariant(!patch.minerIds[minerId])

    miner.patchId = patchId
    patch.minerIds[minerId] = true
  })
}
