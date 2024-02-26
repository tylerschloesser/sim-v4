import { isEqual } from 'lodash-es'
import React, { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { smooth } from './math.js'
import styles from './render-pickaxe.module.scss'
import { Vec2 } from './vec2.js'
import { Pickaxe, World } from './world.js'

export interface RenderPickaxeProps {
  pickaxe: Pickaxe
  setWorld: Updater<World>
}

export const RenderPickaxe = React.memo(
  function RenderPickaxe({ pickaxe }: RenderPickaxeProps) {
    const { radius } = pickaxe

    const handle = useRef<number>()
    const ref = useRef<SVGCircleElement>(null)

    const position = useRef<Vec2>({ ...pickaxe.position })

    useEffect(() => {
      if (isEqual(position.current, pickaxe.position)) {
        return
      }

      const origin = { ...position.current }

      const dx = pickaxe.position.x - origin.x
      const dy = pickaxe.position.y - origin.y

      const duration = 250
      const start = self.performance.now()

      function render() {
        invariant(ref.current)

        const elapsed = self.performance.now() - start
        if (elapsed >= duration) {
          position.current = { ...pickaxe.position }
          ref.current.removeAttribute('transform')
          handle.current = undefined
          return
        }

        const progress = smooth(elapsed / duration)

        position.current.x = origin.x + dx * progress
        position.current.y = origin.y + dy * progress

        const tx = position.current.x - pickaxe.position.x
        const ty = position.current.y - pickaxe.position.y

        const transform = `translate(${tx} ${ty})`
        ref.current.setAttribute('transform', transform)

        handle.current = self.requestAnimationFrame(render)
      }
      handle.current = self.requestAnimationFrame(render)

      return () => {
        if (handle.current) {
          self.cancelAnimationFrame(handle.current)
        }
      }
    }, [pickaxe.position])

    return (
      <circle
        ref={ref}
        className={styles.pickaxe}
        r={radius}
        cx={pickaxe.position.x}
        cy={pickaxe.position.y}
      ></circle>
    )
  },
)
