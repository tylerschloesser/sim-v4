import React from 'react'
import { getCursorEntity } from './cursor.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { getAvailableEntityRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import {
  Cursor,
  EntityType,
  ItemType,
  World,
} from './world.js'

export interface RenderInfoProps {
  cursor: Cursor
  entities: World['entities']
  inventories: World['inventories']
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

  switch (entity?.type) {
    case EntityType.enum.Patch: {
      const patchInventory = getEntityInventory(
        entity,
        inventories,
      )
      return (
        <RenderInventory
          cursorInventory={cursorInventory}
          patchInventory={patchInventory}
        />
      )
    }
    case EntityType.enum.Smelter: {
      const entityInventory = getEntityInventory(
        entity,
        inventories,
      )
      return (
        <div className={styles.info}>
          <div>Recipe: {entity.recipeId ?? 'None'}</div>
          <div>
            Fuel Ticks Remaining:{' '}
            {entity.fuelTicksRemaining}
          </div>
          <div>
            Smelt Ticks Remaining:{' '}
            {entity.smeltTicksRemaining}
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
        </div>
      )
    }
  }

  const availableRecipes =
    getAvailableEntityRecipes(cursorInventory)

  return (
    <div className={styles.info}>
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
    </div>
  )
})
