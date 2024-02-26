import { isEqual } from 'lodash-es'
import React, { useEffect, useState } from 'react'
import { Updater } from 'use-immer'
import { getColor } from './color.js'
import styles from './render-patch.module.scss'
import { Vec2, add, rotate } from './vec2.js'
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
    if (mine) {
      setWorld((draft) => {
        const position: Vec2 = { x, y }

        const v: Vec2 = {
          x: radius + draft.pickaxe.radius * 1.5,
          y: 0,
        }
        rotate(v, Math.PI * -0.33)
        add(position, v)

        if (!isEqual(position, draft.pickaxe.position)) {
          draft.pickaxe.position = position
        }
      })
    }
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
