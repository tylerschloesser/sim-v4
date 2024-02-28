import React from 'react'
import { getPatchItemType } from './inventory.js'
import styles from './render-inventory.module.scss'
import { Inventory } from './world.js'

export interface RenderInventoryProps {
  cursorInventory: Inventory
  patchInventory?: Inventory
}

export const RenderInventory = React.memo(
  function RenderInventory({
    cursorInventory,
    patchInventory,
  }: RenderInventoryProps) {
    if (!patchInventory) {
      return null
    }

    const itemType = getPatchItemType(patchInventory)

    return (
      <div className={styles.inventory}>
        <div>{itemType}</div>
        <div>
          Inventory: {cursorInventory.items[itemType] ?? 0}
        </div>
        <div>
          Patch: {patchInventory.items[itemType] ?? 0}
        </div>
      </div>
    )
  },
)
