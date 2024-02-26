import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Updater, useImmer } from 'use-immer'
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
      {[...pops].map((id) => (
        <Pop key={id} id={id} x={x} y={y} done={done} />
      ))}
    </g>
  )
})

interface PopProps {
  id: string
  x: number
  y: number
  done(id: string): void
}

const Pop = React.memo(function Pop({
  id,
  x,
  y,
  done,
}: PopProps) {
  const handle = useRef<number>()

  useEffect(() => {
    const start = self.performance.now()
    const duration = 1000

    function render() {
      const elapsed = self.performance.now() - start
      if (elapsed >= duration) {
        done(id)
        return
      }

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
      data-id={id}
      className={styles.pop}
      cx={x}
      cy={y}
      r={0.25}
    />
  )
})
