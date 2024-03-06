import React, { Fragment } from 'react'
import styles from './render-panels.module.scss'
import { World } from './world.js'

interface RenderPanelsProps {
  shapes: World['shapes']
}

export const RenderPanels = React.memo(
  function RenderPanels({ shapes }: RenderPanelsProps) {
    return (
      <div className={styles.panels}>
        {Object.values(shapes).map((shape) => (
          <Fragment key={shape.id}>{shape.id}</Fragment>
        ))}
      </div>
    )
  },
)
