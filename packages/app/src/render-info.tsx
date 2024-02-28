import React from 'react'
import invariant from 'tiny-invariant'
import styles from './render-info.module.scss'
import { RenderInventory } from './render-inventory.js'
import { Inventory, World } from './world.js'

export interface RenderInfoProps {
  world: World
}

export const RenderInfo = React.memo(function RenderInfo({
  world,
}: RenderInfoProps) {
  const cursorInventory =
    world.inventories[world.cursor.inventoryId]
  invariant(cursorInventory)

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

  return <div className={styles.info}>TODO</div>
})
