import { isEqual } from 'lodash-es'
import React, { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { smooth } from './math.js'
import styles from './render-pickaxe.module.scss'
import { Vec2, add, rotate } from './vec2.js'
import { Patch, Pickaxe, World } from './world.js'

export interface RenderPickaxeProps {
  pickaxe: Pickaxe
  patch: Patch | null
  setWorld: Updater<World>
}

function useAnimate(
  circle: React.RefObject<SVGCircleElement>,
  next: Vec2,
): void {
  const position = useRef<Vec2>(next)
  const handle = useRef<number>()

  useEffect(() => {
    if (isEqual(next, position.current)) {
      return
    }

    const origin = { ...position.current }

    const dx = next.x - origin.x
    const dy = next.y - origin.y

    const duration = 250
    const start = self.performance.now()

    function render() {
      invariant(circle.current)

      const elapsed = self.performance.now() - start
      if (elapsed >= duration) {
        position.current = next
        circle.current.removeAttribute('transform')
        handle.current = undefined
        return
      }

      const progress = smooth(elapsed / duration)

      position.current.x = origin.x + dx * progress
      position.current.y = origin.y + dy * progress

      const tx = position.current.x - next.x
      const ty = position.current.y - next.y

      const transform = `translate(${tx} ${ty})`
      circle.current.setAttribute('transform', transform)

      handle.current = self.requestAnimationFrame(render)
    }
    handle.current = self.requestAnimationFrame(render)

    return () => {
      if (handle.current) {
        self.cancelAnimationFrame(handle.current)
      }
    }
  }, [next])
}

export const RenderPickaxe = React.memo(
  function RenderPickaxe({
    pickaxe,
    patch,
  }: RenderPickaxeProps) {
    const { radius } = pickaxe

    const ref = useRef<SVGCircleElement>(null)

    let position: Vec2 = { x: 0, y: 0 }
    if (pickaxe.patchId) {
      invariant(patch?.id === pickaxe.patchId)

      position = {
        x: patch.position.x,
        y: patch.position.y,
      }
      const v: Vec2 = {
        x: patch.radius + pickaxe.radius * 1.5,
        y: 0,
      }
      rotate(v, Math.PI * -0.33)
      add(position, v)
    }

    useAnimate(ref, position)

    return (
      <circle
        ref={ref}
        className={styles.pickaxe}
        r={radius}
        cx={position.x}
        cy={position.y}
      ></circle>
    )
  },
)
