import React from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getPatchItemType } from './inventory.js'
import styles from './render-primary-button.module.scss'
import { Cursor, World } from './world.js'

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
            invariant(draft.cursor.patchId)
            const patch =
              draft.patches[draft.cursor.patchId]
            invariant(patch)

            const patchInventory =
              draft.inventories[patch.inventoryId]
            invariant(patchInventory)

            const cursorInventory =
              draft.inventories[draft.cursor.inventoryId]
            invariant(cursorInventory)

            const itemType =
              getPatchItemType(patchInventory)

            const patchCount =
              patchInventory.items[itemType]
            invariant(
              typeof patchCount === 'number' &&
                patchCount >= 1,
            )
            patchInventory.items[itemType] = patchCount - 1

            if (patchCount === 1) {
              delete draft.patches[patch.id]
              delete draft.inventories[patch.inventoryId]
            }

            const cursorCount =
              cursorInventory.items[itemType]
            cursorInventory.items[itemType] =
              (cursorCount ?? 0) + 1
          })
        }}
      >
        Mine
      </button>
    )
  },
)
