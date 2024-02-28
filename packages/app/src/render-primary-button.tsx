import React from 'react'
import { Updater } from 'use-immer'
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
    return (
      <button
        className={styles['primary-button']}
        disabled={cursor.patchId === null}
        onPointerUp={() => {}}
      >
        Mine
      </button>
    )
  },
)
