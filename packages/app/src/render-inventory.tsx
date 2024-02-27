import React, { Fragment } from 'react'
import styles from './render-inventory.module.scss'
import { World } from './world.js'

export interface RenderInventoryProps {
  inventory: World['inventory']
}

export const RenderInventory = React.memo(
  function RenderInventory({
    inventory,
  }: RenderInventoryProps) {
    return (
      <div className={styles.inventory}>
        {Object.entries(inventory).map(([key, value]) => (
          <Fragment key={key}>
            <div>{key}</div>
            <div>{value}</div>
          </Fragment>
        ))}
      </div>
    )
  },
)
