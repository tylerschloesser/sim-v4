import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getCursorEntity } from './cursor.js'
import { deleteEmptyPatch } from './delete.js'
import {
  getCursorInventory,
  getEntityInventory,
  inventoryAdd,
  inventoryMove,
  inventorySub,
} from './inventory.js'
import { entityRecipes } from './recipe.js'
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
  getEntity,
} from './world.js'

export function moveFromEntityOutputToCursor(
  setWorld: Updater<World>,
  items?: Inventory,
): void {
  setWorld((world) => {
    invariant(world.cursor.entityId)
    const entity = getEntity(world, world.cursor.entityId)

    // TODO define which entities this can be done on
    invariant(entity.type !== EntityType.enum.Patch)

    inventoryMove(
      entity.state.output,
      world.cursor.inventory,
      items,
    )
  })
}

export function minePatch(setWorld: Updater<World>): void {
  setWorld((world) => {
    invariant(world.cursor.entityId)
    const entity = getEntity(world, world.cursor.entityId)

    invariant(entity.type === EntityType.enum.Patch)

    const itemType = (() => {
      const keys = Object.keys(entity.state.output)
      invariant(keys.length === 1)
      return ItemType.parse(keys.at(0))
    })()

    inventoryMove(
      entity.state.output,
      world.cursor.inventory,
      { [itemType]: 1 },
    )

    const isPatchEmpty = (() => {
      const keys = Object.keys(entity.state.output)
      invariant(keys.length <= 1)
      return keys.length === 0
    })()

    if (isPatchEmpty) {
      deleteEmptyPatch(world, entity.id)
    }
  })
}

export function moveFromCursorToEntityInput(
  setWorld: Updater<World>,
  items: Inventory,
): void {
  setWorld((world) => {
    invariant(world.cursor.entityId)
    const entity = getEntity(world, world.cursor.entityId)
    inventoryMove(
      world.cursor.inventory,
      entity.state.input,
      items,
    )
  })
}

export function buildEntity(
  setWorld: Updater<World>,
  entityType: EntityType,
  position: Vec2,
): void {
  const recipe = entityRecipes[entityType]
  invariant(recipe)

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
