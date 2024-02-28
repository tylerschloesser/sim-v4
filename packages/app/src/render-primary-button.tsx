import React from 'react'
import styles from './render-primary-button.module.scss'
import { Cursor } from './world.js'

export interface RenderPrimaryButtonProps {
  cursor: Cursor
}

export const RenderPrimaryButton = React.memo(
  function RenderPrimaryButton({
    cursor,
  }: RenderPrimaryButtonProps) {
    return (
      <button
        className={styles['primary-button']}
        disabled={cursor.patchId === null}
      >
        Mine
      </button>
    )
  },
)
