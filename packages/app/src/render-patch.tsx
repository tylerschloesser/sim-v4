import { curry, random } from 'lodash-es'
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { getColor } from './color.js'
import { smooth } from './math.js'
import styles from './render-patch.module.scss'
import { Vec2, mul, rotate } from './vec2.js'
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

  const [pops, setPops] = useImmer<Set<string>>(new Set())

  const nextPopId = useRef<number>(0)

  const [mine, setMine] = useState<boolean>(false)

  useEffect(() => {
    if (!mine) {
      return
    }

    setWorld((draft) => {
      draft.pickaxe.patchId = id
    })

    setPops((prev) => {
      prev.add(`${nextPopId.current++}`)
    })
  }, [mine])

  const done = useCallback((id: string) => {
    setPops((prev) => {
      prev.delete(id)
    })
  }, [])

  return (
    <g data-group={`patch-${id}`}>
      {[...pops].map((id) => (
        <Pop
          key={id}
          id={id}
          x={x}
          y={y}
          patchRadius={radius}
          done={done}
        />
      ))}
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
    </g>
  )
})

interface PopProps {
  id: string
  x: number
  y: number
  patchRadius: number
  done(id: string): void
}

const Pop = React.memo(function Pop({
  id,
  x,
  y,
  patchRadius,
  done,
}: PopProps) {
  const circle = useRef<SVGCircleElement>(null)
  const handle = useRef<number>()

  useEffect(() => {
    const start = self.performance.now()
    const duration = 250

    const angle =
      Math.PI * (-0.66 + random(-0.1, 0.1, true))

    function render() {
      invariant(circle.current)
      const elapsed = self.performance.now() - start
      if (elapsed >= duration) {
        done(id)
        return
      }

      const v: Vec2 = { x: patchRadius * 2.5, y: 0 }
      rotate(v, angle)
      mul(v, smooth(elapsed / duration))
      const { x: tx, y: ty } = v

      circle.current.setAttribute(
        'transform',
        `translate(${tx} ${ty})`,
      )
      circle.current.setAttribute(
        'opacity',
        `${1 - elapsed / duration}`,
      )

      handle.current = self.requestAnimationFrame(render)
    }
    handle.current = self.requestAnimationFrame(render)

    return () => {
      if (handle.current) {
        self.cancelAnimationFrame(handle.current)
      }
    }
  }, [])

  return (
    <circle
      ref={circle}
      data-id={id}
      className={styles.pop}
      cx={x}
      cy={y}
      r={0.25}
    />
  )
})
