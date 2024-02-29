import React, { useContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import { getCursorEntity } from './cursor.js'
import {
  getCursorInventory,
  getPatchItemType,
} from './inventory.js'
import {
  EntityRecipe,
  getAvailableRecipes,
} from './recipe.js'
import styles from './render-primary-button.module.scss'
import { Vec2, vec2 } from './vec2.js'
import {
  Cursor,
  Entity,
  EntityType,
  Inventory,
  ItemType,
  World,
} from './world.js'

/* eslint-disable @typescript-eslint/no-unused-vars */

export interface RenderPrimaryButtonProps {
  cursor: Cursor
  cursorInventory: Inventory
  entities: World['entities']
  setWorld: Updater<World>
}

function build(
  recipe: EntityRecipe,
  camera: Camera,
  setWorld: Updater<World>,
): void {
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

    const entityType = recipe.output

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
      case EntityType.enum.Smelter: {
        entity = {
          type: entityType,
          id: entityId,
          inventoryId: inventory.id,
          position,
          radius: 0.75,
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
  function RenderPrimaryButton(
    props: RenderPrimaryButtonProps,
  ) {
    const entity = getCursorEntity(
      props.cursor,
      props.entities,
    )

    switch (entity?.type) {
      case EntityType.enum.Patch:
        return <RenderPatchPrimaryButton {...props} />
      case EntityType.enum.Smelter:
        return <RenderSmelterPrimaryButton {...props} />
      default:
        return <RenderDefaultPrimaryButton {...props} />
    }
  },
)

function RenderPatchPrimaryButton({
  setWorld,
}: RenderPrimaryButtonProps) {
  return (
    <button
      className={styles['primary-button']}
      onPointerUp={() => {
        setWorld((draft) => {
          invariant(draft.cursor.entityId)
          const entity =
            draft.entities[draft.cursor.entityId]

          invariant(entity?.type === EntityType.enum.Patch)

          const patchInventory =
            draft.inventories[entity.inventoryId]
          invariant(patchInventory)

          const cursorInventory =
            draft.inventories[draft.cursor.inventoryId]
          invariant(cursorInventory)

          const itemType = getPatchItemType(patchInventory)

          const patchCount = patchInventory.items[itemType]
          invariant(
            typeof patchCount === 'number' &&
              patchCount >= 1,
          )
          patchInventory.items[itemType] = patchCount - 1

          if (patchCount === 1) {
            delete draft.entities[entity.id]
            delete draft.inventories[entity.inventoryId]
            draft.cursor.entityId = null
          }

          const cursorCount =
            cursorInventory.items[itemType]
          cursorInventory.items[itemType] =
            (cursorCount ?? 0) + 1
        })
      }}
    >
      Mine
    </button>
  )
}

function RenderDefaultPrimaryButton({
  cursorInventory,
  setWorld,
}: RenderPrimaryButtonProps) {
  const { camera$ } = useContext(AppContext)

  let onPointerUp: (() => void) | undefined = undefined
  const availableRecipes =
    getAvailableRecipes(cursorInventory)
  if (availableRecipes.length > 0) {
    const first = availableRecipes.at(0)
    invariant(first)
    onPointerUp = () =>
      build(first, camera$.value, setWorld)
  }

  const disabled = onPointerUp === undefined

  return (
    <button
      className={styles['primary-button']}
      disabled={disabled}
      onPointerUp={onPointerUp}
    >
      Build
    </button>
  )
}

function RenderSmelterPrimaryButton({}: RenderPrimaryButtonProps) {
  return (
    <button className={styles['primary-button']}>
      TODO
    </button>
  )
}
