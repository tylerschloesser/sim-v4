import { isEqual, pick } from 'lodash-es'
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { AppContext } from './app-context.js'
import { getColor } from './color.js'
import styles from './render-world.module.scss'
import { Vec2 } from './vec2.js'
import { Viewport, getScale } from './viewport.js'
import { Patch, Pickaxe, World } from './world.js'

export interface RenderWorldProps {
  viewport: Viewport
  world: World
  setWorld: Updater<World>
}

export function RenderWorld({
  viewport,
  world,
  setWorld,
}: RenderWorldProps) {
  const root = useRef<SVGGElement>(null)
  const { camera$ } = useContext(AppContext)
  const { x: vx, y: vy } = viewport.size

  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      invariant(camera.zoom >= 0)
      invariant(camera.zoom <= 1)

      const scale = getScale(
        camera.zoom,
        viewport.size.x,
        viewport.size.y,
      )

      invariant(root.current)
      const { x: cx, y: cy } = camera.position

      const tx = -cx * scale
      const ty = -cy * scale

      const transform = [
        `translate(${tx.toFixed(4)} ${ty.toFixed(4)})`,
        `scale(${scale.toFixed(4)})`,
      ].join(' ')

      root.current.setAttribute('transform', transform)
    })

    return () => {
      sub.unsubscribe()
    }
  }, [viewport])

  const viewBox = [-vx / 2, -vy / 2, vx, vy].join(' ')
  return (
    <svg className={styles.world} viewBox={viewBox}>
      <g data-group="transform" ref={root}>
        {Object.values(world.patches).map((patch) => (
          <RenderPatch
            key={patch.id}
            patch={patch}
            setWorld={setWorld}
          />
        ))}
        <RenderPickaxe
          pickaxe={world.pickaxe}
          setWorld={setWorld}
        />
      </g>
    </svg>
  )
}

interface RenderPatchProps {
  patch: Patch
  setWorld: Updater<World>
}

const RenderPatch = React.memo(function Circle({
  patch: {
    id,
    position: { x, y },
    count,
    radius,
  },
  setWorld,
}: RenderPatchProps) {
  console.log(`render patch id=${id} count=${count}`)

  return (
    <circle
      className={styles.circle}
      onPointerUp={() => {
        setWorld((draft) => {
          const position = { x, y }
          if (!isEqual(position, draft.pickaxe.position)) {
            draft.pickaxe.position = position
          }
        })
      }}
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

interface RenderPickaxeProps {
  pickaxe: Pickaxe
  setWorld: Updater<World>
}

const RenderPickaxe = React.memo(function RenderPickaxe({
  pickaxe,
}: RenderPickaxeProps) {
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
        ref.current.setAttribute('transform', '')
        return
      }

      position.current.x =
        origin.x + dx * (elapsed / duration)
      position.current.y =
        origin.y + dy * (elapsed / duration)

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
})
