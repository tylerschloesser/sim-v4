import React from 'react'
import invariant from 'tiny-invariant'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { getAvailableRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import { Entity, EntityType, World } from './world.js'

export interface RenderInfoProps {
  world: World
}

export const RenderInfo = React.memo(function RenderInfo({
  world,
}: RenderInfoProps) {
  let entity: Entity | undefined = undefined
  if (world.cursor.entityId) {
    entity = world.entities[world.cursor.entityId]
    invariant(entity)
  }

  const cursorInventory = getCursorInventory(world)

  switch (entity?.type) {
    case EntityType.enum.Patch: {
      const patchInventory = getEntityInventory(
        world,
        entity,
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
