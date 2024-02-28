import React from 'react'
import invariant from 'tiny-invariant'
import { getCursorInventory } from './inventory.js'
import { getAvailableRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import { Inventory, World } from './world.js'

export interface RenderInfoProps {
  world: World
}

export const RenderInfo = React.memo(function RenderInfo({
  world,
}: RenderInfoProps) {
  const cursorInventory = getCursorInventory(world)

  let patchInventory: Inventory | undefined = undefined
  if (world.cursor.patchId) {
    const patch = world.patches[world.cursor.patchId]
    invariant(patch)
    patchInventory = world.inventories[patch.inventoryId]
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
