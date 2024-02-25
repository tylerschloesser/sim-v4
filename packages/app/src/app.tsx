import { clamp, memoize } from 'lodash-es'
import Prando from 'prando'
import React, { useEffect, useRef } from 'react'
import { BehaviorSubject, combineLatest } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import styles from './app.module.scss'
import { Camera, loadCamera, saveCamera } from './camera.js'
import { Vec2 } from './vec2.js'
import {
  Patch,
  World,
  loadWorld,
  saveWorld,
} from './world.js'

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
    radius,
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
          '--radius': radius,
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
  zoom: number,
  vx: number,
  vy: number,
): number {
  invariant(zoom >= 0)
  invariant(zoom <= 1)

  invariant(vx !== 0)
  invariant(vy !== 0)

  const vmin = Math.min(vx, vy)
  const minScale = vmin * 0.1
  const maxScale = vmin * 0.5
  return minScale + (maxScale - minScale) * zoom
}

export function App() {
  console.log('render app')
  const app = useRef<HTMLDivElement>(null)

  const [world, setWorld] = useImmer(loadWorld())

  useEffect(() => {
    saveWorld(world)
  }, [world])

  useEffect(() => {
    invariant(app.current)

    const controller = new AbortController()
    const { signal } = controller

    const camera$ = new BehaviorSubject(loadCamera())

    camera$.subscribe((camera) => {
      saveCamera(camera)
    })

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
      const viewport = viewport$.value

      const vx = viewport.size.x
      const vy = viewport.size.y

      const prevZoom = camera.zoom
      // prettier-ignore
      const nextZoom = clamp(prevZoom + -ev.deltaY / 1000, 0, 1)

      if (nextZoom === prevZoom) {
        return
      }

      // TODO need to adjust if the app is not the entire viewport
      const rx = ev.clientX - vx / 2
      const ry = ev.clientY - vy / 2

      const prevScale = getScale(prevZoom, vx, vy)
      const nextScale = getScale(nextZoom, vx, vy)

      const dx = rx / prevScale - rx / nextScale
      const dy = ry / prevScale - ry / nextScale

      camera$.next({
        position: {
          x: camera.position.x + dx,
          y: camera.position.y + dy,
        },
        zoom: nextZoom,
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
      const dx = -ev.movementX
      const dy = -ev.movementY

      const camera = camera$.value
      const viewport = viewport$.value
      const scale = getScale(
        camera.zoom,
        viewport.size.x,
        viewport.size.y,
      )

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

      const scale = getScale(
        camera.zoom,
        viewport.size.x,
        viewport.size.y,
      )

      const translate = {
        x: viewport.size.x / 2 + -camera.position.x * scale,
        y: viewport.size.y / 2 + -camera.position.y * scale,
      }

      // prettier-ignore
      {
        app.style.setProperty('--translate-x', `${translate.x}px`)
        app.style.setProperty('--translate-y', `${translate.y}px`)
        app.style.setProperty('--scale', `${scale}`)
      }
    },
  )

  // prettier-ignore
  {
    const options: AddEventListenerOptions = { signal, passive: false }
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, options)
  }
}
