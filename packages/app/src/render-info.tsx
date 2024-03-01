import React from 'react'
import invariant from 'tiny-invariant'
import { getAvailableEntityRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RouteId, useRouteId } from './route.js'
import {
  Entity,
  EntityState,
  EntityType,
  Inventory,
  ItemType,
  PatchEntity,
  SmelterEntity,
  SmelterEntityState,
} from './world.js'

interface RenderPatchInfoProps {
  entity: PatchEntity
  entityInventory: Inventory
  cursorInventory: Inventory
}

function RenderPatchInfo({
  entity,
  entityInventory,
  cursorInventory,
}: RenderPatchInfoProps) {
  const { itemType } = entity
  return (
    <>
      <div>Patch</div>
      <div>
        {itemType}: {entityInventory.items[itemType] ?? 0}{' '}
        [Inventory: {cursorInventory.items[itemType] ?? 0}]
      </div>
    </>
  )
}

interface RenderSmelterInfoProps {
  entity: SmelterEntity
  state: SmelterEntityState
  entityInventory: Inventory
  cursorInventory: Inventory
}

function RenderSmelterInfo({
  entity,
  state,
  entityInventory,
  cursorInventory,
}: RenderSmelterInfoProps) {
  return (
    <>
      <div>{entity.type}</div>
      <div>Recipe: {state.recipeId ?? 'None'}</div>
      <div>
        Fuel Ticks Remaining: {state.fuelTicksRemaining}
      </div>
      <div>
        Smelt Ticks Remaining: {state.smeltTicksRemaining}
      </div>
      {Object.entries(entityInventory.items).map(
        ([key, value]) => {
          const itemType = ItemType.parse(key)
          return (
            <div key={key}>
              {itemType}: {value}{' '}
              {cursorInventory.items[itemType] && (
                <span>
                  {`[Inventory: ${cursorInventory.items[itemType]!}]`}
                </span>
              )}
            </div>
          )
        },
      )}
    </>
  )
}

interface RenderDefaultInfoProps {
  cursorInventory: Inventory
}

function RenderDefaultInfo({
  cursorInventory,
}: RenderDefaultInfoProps) {
  const availableRecipes =
    getAvailableEntityRecipes(cursorInventory)
  return (
    <>
      <div>
        Inventory:{' '}
        {Object.keys(cursorInventory).length === 0 &&
          'None'}
        {Object.entries(cursorInventory.items).map(
          ([key, value]) => {
            const itemType = ItemType.parse(key)
            return (
              <div key={key}>
                {itemType}: {value}
              </div>
            )
          },
        )}
      </div>
      <div>
        Available Recipes:{' '}
        {availableRecipes.length === 0 && 'None'}
      </div>
      {availableRecipes.map((recipe) => (
        <div key={recipe.id}>{recipe.id}</div>
      ))}
    </>
  )
}

export interface RenderInfoProps {
  cursorInventory: Inventory
  entity: Entity | null
  entityInventory: Inventory | null
  entityState: EntityState | null
}

export const RenderInfo = React.memo(function RenderInfo({
  cursorInventory,
  entity,
  entityInventory,
  entityState,
}: RenderInfoProps) {
  const routeId = useRouteId()
  if (routeId === RouteId.enum.BuildMiner) {
    return null
  }

  return (
    <div className={styles.info}>
      {(() => {
        if (!entity) {
          return (
            <RenderDefaultInfo
              cursorInventory={cursorInventory}
            />
          )
        }

        switch (entity.type) {
          case EntityType.enum.Patch: {
            invariant(entityInventory)
            return (
              <RenderPatchInfo
                entity={entity}
                cursorInventory={cursorInventory}
                entityInventory={entityInventory}
              />
            )
          }
          case EntityType.enum.Smelter: {
            invariant(entityInventory)
            invariant(
              entityState?.type === EntityType.enum.Smelter,
            )
            return (
              <RenderSmelterInfo
                entity={entity}
                cursorInventory={cursorInventory}
                entityInventory={entityInventory}
                state={entityState}
              />
            )
          }
          default:
            invariant(false)
        }
      })()}
    </div>
  )
})
