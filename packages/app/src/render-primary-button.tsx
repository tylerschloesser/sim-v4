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
  getPatchItemType,
  inventoryAdd,
  inventoryHas,
  inventorySub,
} from './inventory.js'
import {
  entityRecipes,
  getAvailableEntityRecipes,
  smelterRecipes,
} from './recipe.js'
import styles from './render-primary-button.module.scss'
import { RouteId, useRouteId } from './route.js'
import { Vec2, vec2 } from './vec2.js'
import {
  Entity,
  EntityType,
  Inventory,
  ItemType,
  World,
} from './world.js'

export interface RenderPrimaryButtonProps {
  cursorInventory: Inventory
  entities: World['entities']
  setWorld: Updater<World>
  entity?: Entity
  entityInventory?: Inventory
}

export const RenderPrimaryButton = React.memo(
  function RenderPrimaryButton(
    props: RenderPrimaryButtonProps,
  ) {
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

    switch (props.entity?.type) {
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
  cursorInventory,
  setWorld,
}: RenderPrimaryButtonProps) {
  const navigate = useNavigate()

  let secondary: JSX.Element | null = null

  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  if (inventoryHas(cursorInventory, minerRecipe.input)) {
    secondary = (
      <button
        className={styles['secondary-button']}
        data-pointer="capture"
        onPointerUp={() => {
          navigate('build-miner')
        }}
      >
        Build Miner
      </button>
    )
  }

  const primary = (
    <button
      className={styles['primary-button']}
      data-pointer="capture"
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

  return (
    <>
      {primary}
      {secondary}
    </>
  )
}

function RenderDefaultPrimaryButton({
  cursorInventory,
  setWorld,
}: RenderPrimaryButtonProps) {
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
  entityId: string,
): void {
  setWorld((world) => {
    const cursorInventory = getCursorInventory(
      world.cursor,
      world.inventories,
    )
    const entity = getEntity(world.entities, entityId)

    const entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )

    invariant(entity.type === EntityType.enum.Smelter)

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

function RenderSmelterPrimaryButton({
  cursorInventory,
  setWorld,
  entity,
  entityInventory,
}: RenderPrimaryButtonProps) {
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
