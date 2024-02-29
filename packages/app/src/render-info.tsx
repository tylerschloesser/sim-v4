import React from 'react'
import { getCursorEntity } from './cursor.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { getAvailableRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import { Cursor, EntityType, World } from './world.js'

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
  }

  const availableRecipes =
    getAvailableRecipes(cursorInventory)

  return (
    <div className={styles.info}>
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
