import React from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import styles from './render-primary-button.module.scss'
import { Cursor, ItemType, World } from './world.js'

export interface RenderPrimaryButtonProps {
  cursor: Cursor
  setWorld: Updater<World>
}

export const RenderPrimaryButton = React.memo(
  function RenderPrimaryButton({
    cursor,
    setWorld,
  }: RenderPrimaryButtonProps) {
    const disabled = cursor.patchId === null
    return (
      <button
        className={styles['primary-button']}
        disabled={disabled}
        onPointerUp={() => {
          if (disabled) {
            return
          }
          setWorld((draft) => {
            const inventory =
              draft.inventories[draft.cursor.inventoryId]
            invariant(inventory)

            const itemType = ItemType.enum.IronOre
            const count = inventory.items[itemType]
            inventory.items[itemType] = (count ?? 0) + 1
          })
        }}
      >
        Mine
      </button>
    )
  },
)
