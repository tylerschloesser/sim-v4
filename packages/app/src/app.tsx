import { useEffect, useRef, useState } from 'react'
import { BehaviorSubject, Subscription } from 'rxjs'
import invariant from 'tiny-invariant'
import { useImmer } from 'use-immer'
import { AppContext } from './app-context.js'
import styles from './app.module.scss'
import { Camera, loadCamera, saveCamera } from './camera.js'
import { getCursorInventory } from './inventory.js'
import { handlePointer } from './pointer.js'
import { RenderInfo } from './render-info.js'
import { RenderPrimaryButton } from './render-primary-button.js'
import { RenderViewport } from './render-viewport.js'
import { Viewport } from './viewport.js'
import { handleWheel } from './wheel.js'
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
  const [camera$] = useState(
    new BehaviorSubject(loadCamera()),
  )
  const [viewport, setViewport] = useState<Viewport | null>(
    null,
  )

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

  useEffect(() => {
    console.log('cursor patchId', world.cursor.patchId)
  }, [world.cursor.patchId])

  const cursorInventory = getCursorInventory(world)

  return (
    <div className={styles.app} ref={app}>
      {viewport && (
        <AppContext.Provider value={{ camera$, viewport }}>
          <RenderViewport
            world={world}
            setWorld={setWorld}
          />
          <RenderInfo world={world} />
          <RenderPrimaryButton
            cursor={world.cursor}
            cursorInventory={cursorInventory}
            setWorld={setWorld}
          />
        </AppContext.Provider>
      )}
      <ResetButton />
    </div>
  )
}

function ResetButton() {
  return (
    <button
      className={styles['reset-button']}
      onPointerUp={() => {
        if (window.confirm('Reset?')) {
          localStorage.clear()
          self.location.reload()
        }
      }}
    >
      Reset
    </button>
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
