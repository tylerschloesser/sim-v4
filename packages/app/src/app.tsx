import { useEffect, useRef, useState } from 'react'
import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import { BehaviorSubject, Subscription } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import { AppContext } from './app-context.js'
import styles from './app.module.scss'
import { Camera, loadCamera, saveCamera } from './camera.js'
import { PathRoot } from './path-root.js'
import { PathSettings } from './path-settings.js'
import { handlePointer } from './pointer.js'
import { tickWorld } from './tick-world.js'
import { ViewType } from './view.js'
import { Viewport } from './viewport.js'
import { handleWheel } from './wheel.js'
import { World, loadWorld, saveWorld } from './world.js'

function rectToViewport(rect: DOMRect): Viewport {
  return {
    size: {
      x: rect.width,
      y: rect.height,
    },
    // TODO support changes to this value via media query
    dpr: window.devicePixelRatio,
  }
}

function useTickWorld(setWorld: Updater<World>) {
  const interval = useRef<number>()
  useEffect(() => {
    interval.current = self.setInterval(() => {
      tickWorld(setWorld)
    }, 100)
    return () => {
      self.clearInterval(interval.current)
    }
  }, [])
}

const router = createBrowserRouter([
  {
    path: '/',
    Component: PathRoot,
    children: [
      {
        index: true,
        element: null,
        handle: {
          viewType: ViewType.enum.Default,
        },
      },
      {
        path: 'settings',
        Component: PathSettings,
      },
    ],
  },
])

export function App() {
  const app = useRef<HTMLDivElement>(null)

  const [world, setWorld] = useImmer(loadWorld())
  const [camera$] = useState(
    new BehaviorSubject(loadCamera()),
  )
  const [viewport, setViewport] = useState<Viewport | null>(
    null,
  )

  useTickWorld(setWorld)

  useEffect(() => {
    saveWorld(world)
  }, [world])

  useEffect(() => {
    invariant(app.current)

    const subs = new Array<Subscription>()
    const controller = new AbortController()
    const { signal } = controller

    const viewport$ = new BehaviorSubject(
      rectToViewport(app.current.getBoundingClientRect()),
    )

    subs.push(camera$.subscribe(saveCamera))
    subs.push(viewport$.subscribe(setViewport))

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

    return () => {
      controller.abort()
      ro.disconnect()
      subs.forEach((sub) => sub.unsubscribe())
    }
  }, [])

  return (
    <div className={styles.app} ref={app}>
      {viewport && (
        <AppContext.Provider
          value={{
            camera$,
            viewport,
            world,
            setWorld,
          }}
        >
          <RouterProvider router={router} />
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
      handleWheel(ev, camera$, viewport$)
    },
    { signal, passive: false },
  )

  // prettier-ignore
  {
    app.addEventListener('pointermove', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerdown', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerup', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerenter', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerleave', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointercancel', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerover', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
    app.addEventListener('pointerout', (ev) => { handlePointer(ev, camera$, viewport$) }, { signal })
  }

  // prettier-ignore
  {
    const options: AddEventListenerOptions = { signal, passive: false }
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, options)
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, options)
  }
}
