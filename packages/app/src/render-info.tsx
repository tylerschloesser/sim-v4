import React from 'react'
import invariant from 'tiny-invariant'
import { getCursorInventory } from './inventory.js'
import { getAvailableRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import { EntityType, Inventory, World } from './world.js'

export interface RenderInfoProps {
  world: World
}

export const RenderInfo = React.memo(function RenderInfo({
  world,
}: RenderInfoProps) {
  const cursorInventory = getCursorInventory(world)

  let patchInventory: Inventory | undefined = undefined
  if (world.cursor.entityId) {
    const entity = world.entities[world.cursor.entityId]

    // TODO allow other entities
    invariant(entity?.type === EntityType.enum.Patch)

    patchInventory = world.inventories[entity.inventoryId]
    invariant(patchInventory)
  }

  if (patchInventory) {
    return (
      <RenderInventory
        cursorInventory={cursorInventory}
        patchInventory={patchInventory}
      />
    )
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
