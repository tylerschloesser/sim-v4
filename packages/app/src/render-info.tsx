import React from 'react'
import invariant from 'tiny-invariant'
import { getCursorEntity } from './cursor.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { getAvailableEntityRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RouteId, useRouteId } from './route.js'
import {
  Cursor,
  EntityType,
  Inventory,
  ItemType,
  PatchEntity,
  SmelterEntity,
  World,
} from './world.js'

export interface RenderInfoProps {
  cursor: Cursor
  entities: World['entities']
  inventories: World['inventories']
}

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
      <div>{itemType}</div>
      <div>
        Inventory: {cursorInventory.items[itemType] ?? 0}
      </div>
      <div>
        Patch: {entityInventory.items[itemType] ?? 0}
      </div>
    </>
  )
}

interface RenderSmelterInfoProps {
  entity: SmelterEntity
  entityInventory: Inventory
  cursorInventory: Inventory
}

function RenderSmelterInfo({
  entity,
  entityInventory,
  cursorInventory,
}: RenderSmelterInfoProps) {
  return (
    <>
      <div>Recipe: {entity.recipeId ?? 'None'}</div>
      <div>
        Fuel Ticks Remaining: {entity.fuelTicksRemaining}
      </div>
      <div>
        Smelt Ticks Remaining: {entity.smeltTicksRemaining}
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

export const RenderInfo = React.memo(function RenderInfo({
  cursor,
  entities,
  inventories,
}: RenderInfoProps) {
  const entity = getCursorEntity(cursor, entities)
  const cursorInventory = getCursorInventory(
    cursor,
    inventories,
  )

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
            return (
              <RenderPatchInfo
                entity={entity}
                cursorInventory={cursorInventory}
                entityInventory={getEntityInventory(
                  entity,
                  inventories,
                )}
              />
            )
          }
          case EntityType.enum.Smelter: {
            return (
              <RenderSmelterInfo
                entity={entity}
                cursorInventory={cursorInventory}
                entityInventory={getEntityInventory(
                  entity,
                  inventories,
                )}
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
