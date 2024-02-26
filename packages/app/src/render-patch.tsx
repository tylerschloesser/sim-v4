import React, { useEffect, useState } from 'react'
import { Updater } from 'use-immer'
import { getColor } from './color.js'
import styles from './render-patch.module.scss'
import { Patch, World } from './world.js'

export interface RenderPatchProps {
  patch: Patch
  setWorld: Updater<World>
}

export const RenderPatch = React.memo(function Circle({
  patch: {
    id,
    position: { x, y },
    count,
    radius,
  },
  setWorld,
}: RenderPatchProps) {
  console.log(`render patch id=${id} count=${count}`)

  const [mine, setMine] = useState<boolean>(false)

  useEffect(() => {
    if (!mine) {
      return
    }

    setWorld((draft) => {
      draft.pickaxe.patchId = id
    })
  }, [mine])

  return (
    <circle
      className={styles.patch}
      onPointerDown={() => setMine(true)}
      onPointerUp={() => setMine(false)}
      onPointerLeave={() => setMine(false)}
      cx={x}
      cy={y}
      r={radius}
      style={
        {
          '--color': getColor(id),
        } as React.CSSProperties
      }
    />
  )
})
