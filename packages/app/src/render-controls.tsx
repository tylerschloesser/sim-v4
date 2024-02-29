import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getCursorEntity } from './cursor.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import {
  entityRecipes,
  getAvailableEntityRecipes,
  smelterRecipes,
} from './recipe.js'
import styles from './render-controls.module.scss'
import { RouteId, useRouteId } from './route.js'
import { Vec2, vec2 } from './vec2.js'
import {
  Entity,
  EntityType,
  Inventory,
  ItemType,
  SmelterEntity,
  World,
} from './world.js'

export interface RenderControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity?: Entity
  entityInventory?: Inventory
}

export const RenderControls = React.memo(
  function RenderControls({
    cursorInventory,
    setWorld,
    entity,
    entityInventory,
  }: RenderControlsProps) {
    const navigate = useNavigate()

    const routeId = useRouteId()
    if (routeId === RouteId.enum.BuildMiner) {
      return (
        <button
          className={styles['primary-button']}
          data-pointer="capture"
          onPointerUp={() => {
            navigate('..')
          }}
        >
          Back
        </button>
      )
    }

    switch (entity?.type) {
      case EntityType.enum.Patch:
        return (
          <RenderPatchControls
            cursorInventory={cursorInventory}
            setWorld={setWorld}
          />
        )
      case EntityType.enum.Smelter:
        invariant(entityInventory)
        return (
          <RenderSmelterControls
            cursorInventory={cursorInventory}
            setWorld={setWorld}
            entity={entity}
            entityInventory={entityInventory}
          />
        )
      default:
        return (
          <RenderDefaultControls
            cursorInventory={cursorInventory}
            setWorld={setWorld}
          />
        )
    }
  },
)

type ButtonProps = React.PropsWithChildren<{
  disabled?: boolean
  onPointerUp(): void
}>

function RenderPrimaryButton({
  disabled = false,
  onPointerUp,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['primary-button']}
      data-pointer="capture"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function RenderSecondaryButton({
  disabled = false,
  onPointerUp,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['secondary-button']}
      data-pointer="capture"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function minePatch(setWorld: Updater<World>): void {
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

interface RenderPatchControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
}

function RenderPatchControls({
  cursorInventory,
  setWorld,
}: RenderPatchControlsProps) {
  const navigate = useNavigate()
  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  return (
    <>
      <RenderPrimaryButton
        onPointerUp={() => minePatch(setWorld)}
      >
        Mine
      </RenderPrimaryButton>

      {inventoryHas(cursorInventory, minerRecipe.input) && (
        <RenderSecondaryButton
          onPointerUp={() => {
            navigate('build-miner')
          }}
        >
          Build Miner
        </RenderSecondaryButton>
      )}
    </>
  )
}

interface RenderDefaultControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
}

function RenderDefaultControls({
  cursorInventory,
  setWorld,
}: RenderDefaultControlsProps) {
  const { camera$ } = useContext(AppContext)

  let onPointerUp: (() => void) | undefined = undefined
  const availableRecipes =
    getAvailableEntityRecipes(cursorInventory)

  const recipe = availableRecipes.at(0)

  if (recipe) {
    onPointerUp = () => {
      const camera = camera$.value
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
          invariant(
            typeof count === 'number' && count >= value,
          )
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
              recipeId: null,
              smeltTicksRemaining: null,
              fuelTicksRemaining: null,
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
  }

  const disabled = onPointerUp === undefined

  return (
    <button
      className={styles['primary-button']}
      disabled={disabled}
      onPointerUp={onPointerUp}
    >
      Build {recipe?.id}
    </button>
  )
}

function takeAllFromSmelter(
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

interface RenderSmelterControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity: SmelterEntity
  entityInventory: Inventory
}

function RenderSmelterControls({
  cursorInventory,
  setWorld,
  entity,
  entityInventory,
}: RenderSmelterControlsProps) {
  invariant(entity?.type === EntityType.enum.Smelter)
  invariant(entityInventory?.id === entity.inventoryId)

  let secondary: JSX.Element
  {
    const itemType = ItemType.enum.IronPlate
    const hasOutput =
      (entityInventory.items[itemType] ?? 0) > 0

    secondary = (
      <button
        className={styles['secondary-button']}
        disabled={!hasOutput}
        onPointerUp={() => {
          if (!hasOutput) return
          takeAllFromSmelter(setWorld, entity.id)
        }}
      >
        Take
        <br />
        All
      </button>
    )
  }

  const coalCount =
    entityInventory.items[ItemType.enum.Coal] ?? 0
  const hasCoal =
    (cursorInventory.items[ItemType.enum.Coal] ?? 0) > 0

  let primary: JSX.Element

  if (coalCount < 5 && hasCoal) {
    primary = (
      <button
        className={styles['primary-button']}
        onPointerUp={() => {
          if (!hasCoal) return
          setWorld((draft) => {
            const cursorInventory = getCursorInventory(
              draft.cursor,
              draft.inventories,
            )
            const entity = getCursorEntity(
              draft.cursor,
              draft.entities,
            )
            invariant(
              entity?.type === EntityType.enum.Smelter,
            )
            const entityInventory = getEntityInventory(
              entity,
              draft.inventories,
            )
            const items = { [ItemType.enum.Coal]: 1 }
            inventorySub(cursorInventory, items)
            inventoryAdd(entityInventory, items)
          })
        }}
      >
        Add
        <br />
        Coal
      </button>
    )
  } else {
    const hasIron =
      (cursorInventory.items[ItemType.enum.IronOre] ?? 0) >
      0
    primary = (
      <>
        <button
          className={styles['primary-button']}
          disabled={!hasIron}
          onPointerUp={() => {
            if (!hasIron) return
            setWorld((draft) => {
              const cursorInventory = getCursorInventory(
                draft.cursor,
                draft.inventories,
              )
              const entity = getCursorEntity(
                draft.cursor,
                draft.entities,
              )
              invariant(
                entity?.type === EntityType.enum.Smelter,
              )
              const entityInventory = getEntityInventory(
                entity,
                draft.inventories,
              )
              const items = { [ItemType.enum.IronOre]: 1 }
              inventorySub(cursorInventory, items)
              inventoryAdd(entityInventory, items)
            })
          }}
        >
          Add
          <br />
          Iron
          <br />
          Ore
        </button>
      </>
    )
  }

  return (
    <>
      {primary}
      {secondary}
    </>
  )
}
