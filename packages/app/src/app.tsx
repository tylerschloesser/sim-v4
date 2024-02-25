import { clamp, memoize } from 'lodash-es'
import Prando from 'prando'
import React, { useEffect, useRef } from 'react'
import { BehaviorSubject, combineLatest } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import styles from './app.module.scss'
import { Camera, loadCamera } from './camera.js'
import { Vec2 } from './vec2.js'
import { Patch, World, loadWorld } from './world.js'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})

interface CircleProps {
  patch: Patch
  setWorld: Updater<World>
}

const Circle = React.memo(function Circle({
  patch: {
    id,
    position: { x, y },
    count,
  },
  setWorld,
}: CircleProps) {
  console.log(`render patch id=${id} count=${count}`)
  return (
    <svg
      className={styles.circle}
      style={
        {
          '--color': getColor(id),
          '--x': x,
          '--y': y,
        } as React.CSSProperties
      }
      viewBox="0 0 100 100"
    >
      <circle
        onPointerUp={() => {
          setWorld((draft) => {
            const patch = draft.patches[id]
            invariant(patch)
            patch.count -= 1
          })
        }}
        cx="50"
        cy="50"
        r="50"
        style={{
          fill: 'var(--color)',
        }}
      />
    </svg>
  )
})

interface Viewport {
  size: Vec2
}

function rectToViewport(rect: DOMRect): Viewport {
  return {
    size: {
      x: rect.width,
      y: rect.height,
    },
  }
}

function getScale(
  camera: Camera,
  viewport: Viewport,
): number {
  invariant(camera.zoom >= 0)
  invariant(camera.zoom <= 1)

  invariant(viewport.size.x !== 0)
  invariant(viewport.size.y !== 0)

  const vmin = Math.min(viewport.size.x, viewport.size.y)
  const minScale = vmin * 0.1
  const maxScale = vmin * 0.5
  return minScale + (maxScale - minScale) * camera.zoom
}

export function App() {
  console.log('render app')
  const app = useRef<HTMLDivElement>(null)

  const [world, setWorld] = useImmer(loadWorld())

  useEffect(() => {
    invariant(app.current)

    const controller = new AbortController()
    const { signal } = controller

    const camera$ = new BehaviorSubject(loadCamera())
    const viewport$ = new BehaviorSubject(
      rectToViewport(app.current.getBoundingClientRect()),
    )

    const ro = new ResizeObserver((entries) => {
      invariant(entries.length === 1)
      const [entry] = entries
      invariant(entry)
      viewport$.next(rectToViewport(entry.contentRect))
    })
    ro.observe(app.current)

    init({
      app: app.current,
      signal,
      viewport$,
      camera$,
    })

    invariant(app.current)

    return () => {
      controller.abort()
      ro.disconnect()
    }
  }, [])

  return (
    <div className={styles.app} ref={app}>
      <div className={styles.world}>
        {Object.values(world.patches).map((patch) => (
          <Circle
            key={patch.id}
            patch={patch}
            setWorld={setWorld}
          />
        ))}
      </div>
    </div>
  )
}

function init({
  app,
  signal,
  viewport$,
  camera$,
}: {
  app: HTMLDivElement
  signal: AbortSignal
  viewport$: BehaviorSubject<Viewport>
  camera$: BehaviorSubject<Camera>
}): void {
  app.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault()
      const camera = camera$.value
      camera$.next({
        ...camera,
        zoom: clamp(camera.zoom + -ev.deltaY / 1000, 0, 1),
      })
    },
    { signal, passive: false },
  )

  app.addEventListener(
    'pointermove',
    (ev) => {
      if (!ev.buttons) {
        return
      }
      const dx = ev.movementX
      const dy = ev.movementY

      const camera = camera$.value
      const viewport = viewport$.value
      const scale = getScale(camera, viewport)

      camera$.next({
        ...camera,
        position: {
          x: camera.position.x + dx / scale,
          y: camera.position.y + dy / scale,
        },
      })
    },
    { signal },
  )

  combineLatest([camera$, viewport$]).subscribe(
    ([camera, viewport]) => {
      invariant(camera.zoom >= 0)
      invariant(camera.zoom <= 1)

      const scale = getScale(camera, viewport)

      const translate = {
        x: viewport.size.x / 2 + camera.position.x * scale,
        y: viewport.size.y / 2 + camera.position.y * scale,
      }

      app.style.setProperty('--cx', `${translate.x}px`)
      app.style.setProperty('--cy', `${translate.y}px`)
      app.style.setProperty('--scale', `${scale}`)
    },
  )

  // prettier-ignore
  {
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, { signal, passive: false })
  }
}
