import { clamp, isEqual, memoize } from 'lodash-es'
import Prando from 'prando'
import React, { useEffect, useRef } from 'react'
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  scan,
  shareReplay,
  startWith,
  withLatestFrom,
} from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater, useImmer } from 'use-immer'
import styles from './app.module.scss'
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
  w: number
  h: number
}

interface Camera {
  x: number
  y: number
  zoom: number
}

export function App() {
  console.log('render app')
  const app = useRef<HTMLDivElement>(null)

  const [world, setWorld] = useImmer(loadWorld())

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(app.current)

    const rect$ = new BehaviorSubject<DOMRect>(
      app.current.getBoundingClientRect(),
    )

    const ro = new ResizeObserver((entries) => {
      invariant(entries.length === 1)
      const [entry] = entries
      invariant(entry)
      rect$.next(entry.contentRect)
    })
    ro.observe(app.current)

    const viewport$: Observable<Viewport> = rect$.pipe(
      map(({ width: w, height: h }) => ({ w, h })),
      distinctUntilChanged(isEqual),
    )

    init({
      app: app.current,
      signal,
      viewport$,
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

interface Transform {
  translate: {
    x: number
    y: number
    z: number
  }
  scale: number
}

const initialCamera: Camera = {
  x: -0.5,
  y: -0.5,
  zoom: 0.5,
}

function init({
  app,
  signal,
  viewport$,
}: {
  app: HTMLDivElement
  signal: AbortSignal
  viewport$: Observable<Viewport>
}): void {
  const squareSize$ = viewport$.pipe(
    map((viewport) => {
      return Math.max(viewport.w, viewport.h) * 0.5
    }),
  )

  const camera$ = merge(
    fromEvent<WheelEvent>(app, 'wheel', { passive: false }),
    fromEvent<PointerEvent>(app, 'pointermove'),
  ).pipe(
    withLatestFrom(squareSize$),
    scan((camera, [ev, squareSize]) => {
      if (ev instanceof PointerEvent) {
        if (!ev.buttons) {
          return camera
        }
        const dx = ev.movementX
        const dy = ev.movementY
        return {
          ...camera,
          x: camera.x + dx / squareSize,
          y: camera.y + dy / squareSize,
        }
      } else if (ev instanceof WheelEvent) {
        ev.preventDefault()

        return {
          ...camera,
          zoom: clamp(
            camera.zoom + -ev.deltaY / 1000,
            0,
            1,
          ),
        }
      } else {
        invariant(false)
      }
    }, initialCamera),
    startWith(initialCamera),
  )

  squareSize$.subscribe((squareSize) => {
    app.style.setProperty(
      '--square-size',
      `${squareSize}px`,
    )
  })

  const transform$ = combineLatest([
    camera$,
    viewport$,
    squareSize$,
  ]).pipe(
    map(([camera, viewport, squareSize]) => {
      invariant(camera.zoom >= 0)
      invariant(camera.zoom <= 1)

      const transform: Transform = {
        translate: {
          x: viewport.w / 2 + camera.x * squareSize,
          y: viewport.h / 2 + camera.y * squareSize,
          z: 0,
        },
        scale: 0.1 + camera.zoom * 0.9,
      }

      return transform
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  )

  transform$.subscribe(({ translate, scale }) => {
    app.style.setProperty('--cx', `${translate.x}px`)
    app.style.setProperty('--cy', `${translate.y}px`)
    app.style.setProperty('--scale', scale.toFixed(4))
  })

  // prettier-ignore
  {
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, { signal, passive: false })
  }
}
