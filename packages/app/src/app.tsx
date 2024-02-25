import { clamp, isEqual, memoize } from 'lodash-es'
import Prando from 'prando'
import { useEffect, useRef } from 'react'
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
import styles from './app.module.scss'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})

interface SquareProps {
  id: string
  x: number
  y: number
}

function Square({ id, x, y }: SquareProps) {
  return (
    <div
      className={styles.square}
      data-id={id}
      style={
        {
          '--color': getColor(id),
          '--x': x,
          '--y': y,
        } as React.CSSProperties
      }
    />
  )
}

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
  const app = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(app.current)
    invariant(world.current)

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
      world: world.current,
      signal,
      viewport$,
    })

    invariant(app.current)

    return () => {
      controller.abort()
      ro.disconnect()
    }
  }, [])

  const squares = new Array<JSX.Element>()

  const r = 1

  for (let x = -r; x <= r; x++) {
    for (let y = -r; y <= r; y++) {
      const id = `${x}.${y}`
      squares.push(<Square key={id} id={id} x={x} y={y} />)
    }
  }

  return (
    <div className={styles.app} ref={app}>
      <div className={styles.world} ref={world}>
        {squares}
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
  world,
  signal,
  viewport$,
}: {
  app: HTMLDivElement
  world: HTMLDivElement
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
    world.style.setProperty(
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
    world.style.setProperty('--cx', `${translate.x}px`)
    world.style.setProperty('--cy', `${translate.y}px`)
    world.style.setProperty('--scale', scale.toFixed(4))
  })

  app.addEventListener(
    'pointerdown',
    (ev) => {
      if (ev.target instanceof Element) {
        const square = ev.target.closest('[data-id]')
        if (square) {
          invariant(square instanceof HTMLElement)
          const id = square.dataset['id']
          invariant(id)
          console.log(`id: ${id}`)
        }
      }
    },
    { signal },
  )

  // prettier-ignore
  {
    app.addEventListener('touchcancel', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchend', (ev) => { ev.preventDefault() }, { signal, passive: false })
    app.addEventListener('touchstart', (ev) => { ev.preventDefault() }, { signal, passive: false })
  }
}
