import { clamp } from 'lodash-es'
import { useEffect, useRef, useState } from 'react'
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext, IAppContext } from './app-context.js'
import styles from './app.module.scss'
import { Camera, loadCamera, saveCamera } from './camera.js'
import { RenderGrid } from './render-grid.js'
import { RenderWorld } from './render-world.js'
import { Viewport, getScale } from './viewport.js'
import { loadWorld, saveWorld } from './world.js'

function rectToViewport(rect: DOMRect): Viewport {
  return {
    size: {
      x: rect.width,
      y: rect.height,
    },
    dpr: window.devicePixelRatio, // TODO refactor this
  }
}

export function App() {
  const app = useRef<HTMLDivElement>(null)

  const [world, setWorld] = useImmer(loadWorld())

  const [context, setContext] =
    useState<IAppContext | null>(null)

  const [viewport, setViewport] = useState<Viewport | null>(
    null,
  )

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

    // TODO refactor this?
    viewport$.subscribe(setViewport)

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

    setContext({ camera$ })

    return () => {
      controller.abort()
      ro.disconnect()
    }
  }, [])

  return (
    <div className={styles.app} ref={app}>
      {context && viewport && (
        <AppContext.Provider value={context}>
          <RenderGrid viewport={viewport} />
          <RenderWorld
            viewport={viewport}
            world={world}
            setWorld={setWorld}
          />
        </AppContext.Provider>
      )}
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

  // prettier-ignore
  {
    const options: AddEventListenerOptions = { signal, passive: false }
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, options)
  }
}
