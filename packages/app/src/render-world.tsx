import { isEqual } from 'lodash-es'
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
import { RenderPickaxe } from './render-pickaxe.js'
import styles from './render-world.module.scss'
import { Vec2, add, mul, rotate } from './vec2.js'
import { Viewport, getScale } from './viewport.js'
import { Patch, World } from './world.js'

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
      className={styles.circle}
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
