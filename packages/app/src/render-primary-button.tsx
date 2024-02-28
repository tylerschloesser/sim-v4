import React, { useContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import {
  getCursorInventory,
  getPatchItemType,
} from './inventory.js'
import { Recipe, getAvailableRecipes } from './recipe.js'
import styles from './render-primary-button.module.scss'
import { Vec2, vec2 } from './vec2.js'
import {
  Cursor,
  Entity,
  Inventory,
  ItemType,
  World,
} from './world.js'

export interface RenderPrimaryButtonProps {
  cursor: Cursor
  cursorInventory: Inventory
  entities: World['entities']
  setWorld: Updater<World>
}

function mine(setWorld: Updater<World>): void {
  setWorld((draft) => {
    invariant(draft.cursor.patchId)
    const patch = draft.patches[draft.cursor.patchId]
    invariant(patch)

    const patchInventory =
      draft.inventories[patch.inventoryId]
    invariant(patchInventory)

    const cursorInventory =
      draft.inventories[draft.cursor.inventoryId]
    invariant(cursorInventory)

    const itemType = getPatchItemType(patchInventory)

    const patchCount = patchInventory.items[itemType]
    invariant(
      typeof patchCount === 'number' && patchCount >= 1,
    )
    patchInventory.items[itemType] = patchCount - 1

    if (patchCount === 1) {
      delete draft.patches[patch.id]
      delete draft.inventories[patch.inventoryId]
      draft.cursor.patchId = null
    }

    const cursorCount = cursorInventory.items[itemType]
    cursorInventory.items[itemType] = (cursorCount ?? 0) + 1
  })
}

function build(
  recipe: Recipe,
  camera: Camera,
  setWorld: Updater<World>,
): void {
  setWorld((draft) => {
    const cursorInventory = getCursorInventory(draft)

    for (const [key, value] of Object.entries(
      recipe.input,
    )) {
      const itemType = ItemType.parse(key)
      let count = cursorInventory.items[itemType]
      invariant(typeof count === 'number' && count >= value)
      count -= value
      if (count === 0) {
        delete cursorInventory.items[itemType]
      }
    }

    invariant(Object.keys(recipe.output).length === 1)
    invariant(Object.values(recipe.output).at(0) === 1)
    const entityType = ItemType.parse(
      Object.keys(recipe.output).at(0),
    )

    let entity: Entity
    const entityId = `${draft.nextEntityId++}`

    const inventory: Inventory = {
      id: `${draft.nextInventoryId++}`,
      items: {},
    }
    invariant(!draft.inventories[inventory.id])
    draft.inventories[inventory.id] = inventory

    const position: Vec2 = vec2.clone(camera.position)

    switch (entityType) {
      case ItemType.enum.Smelter: {
        entity = {
          type: entityType,
          id: entityId,
          inventoryId: inventory.id,
          position,
          radius: 1,
        }
        break
      }
      default:
        invariant(false)
    }

    invariant(!draft.entities[entity.id])
    draft.entities[entity.id] = entity
  })
}

function isBuildValid(
  camera: Camera,
  entities: World['entities'],
): boolean {
  return true
}

function useIsBuildValid(
  camera$: BehaviorSubject<Camera>,
  entities: World['entities'],
) {}

export const RenderPrimaryButton = React.memo(
  function RenderPrimaryButton({
    cursor,
    cursorInventory,
    entities,
    setWorld,
  }: RenderPrimaryButtonProps) {
    let onPointerUp: undefined | (() => void) = undefined
    let label: string

    const { camera$ } = useContext(AppContext)

    if (cursor.patchId) {
      onPointerUp = () => mine(setWorld)
      label = 'Mine'
    } else {
      const availableRecipes =
        getAvailableRecipes(cursorInventory)
      if (availableRecipes.length > 0) {
        const first = availableRecipes.at(0)
        invariant(first)
        onPointerUp = () =>
          build(first, camera$.value, setWorld)
      }
      label = 'Build'
    }

    const disabled = onPointerUp === undefined

    return (
      <button
        className={styles['primary-button']}
        disabled={disabled}
        onPointerUp={onPointerUp}
      >
        {label}
      </button>
    )
  },
)
