import React from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { getPatchItemType } from './inventory.js'
import styles from './render-primary-button.module.scss'
import { Cursor, Inventory, World } from './world.js'

export interface RenderPrimaryButtonProps {
  cursor: Cursor
  cursorInventory: Inventory
  setWorld: Updater<World>
}

function mine(setWorld: Updater<World>): void {
  setWorld((draft) => {
    invariant(draft.cursor.patchId)
    const patch = draft.patches[draft.cursor.patchId]
    invariant(patch)

    const patchInventory =
      draft.inventories[patch.inventoryId]
    invariant(patchInventory)

    const cursorInventory =
      draft.inventories[draft.cursor.inventoryId]
    invariant(cursorInventory)

    const itemType = getPatchItemType(patchInventory)

    const patchCount = patchInventory.items[itemType]
    invariant(
      typeof patchCount === 'number' && patchCount >= 1,
    )
    patchInventory.items[itemType] = patchCount - 1

    if (patchCount === 1) {
      delete draft.patches[patch.id]
      delete draft.inventories[patch.inventoryId]
      draft.cursor.patchId = null
    }

    const cursorCount = cursorInventory.items[itemType]
    cursorInventory.items[itemType] = (cursorCount ?? 0) + 1
  })
}

function build(setWorld: Updater<World>): void {}

export const RenderPrimaryButton = React.memo(
  function RenderPrimaryButton({
    cursor,
    setWorld,
  }: RenderPrimaryButtonProps) {
    let onPointerUp: undefined | (() => void)
    let label: string

    if (cursor.patchId) {
      onPointerUp = () => mine(setWorld)
      label = 'Mine'
    } else {
      onPointerUp = () => build(setWorld)
      label = 'Build'
    }

    const disabled = onPointerUp === undefined

    return (
      <button
        className={styles['primary-button']}
        disabled={disabled}
        onPointerUp={onPointerUp}
      >
        {label}
      </button>
    )
  },
)
