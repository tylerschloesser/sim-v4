import { clamp, memoize } from 'lodash-es'
import Prando from 'prando'
import { useEffect, useRef } from 'react'
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

export function App() {
  const app = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(app.current)
    invariant(world.current)

    const ro = new ResizeObserver((entries) => {
      invariant(entries.length === 1)
      const [entry] = entries
      invariant(entry)
      invariant(app.current)
      const { width, height } = entry.contentRect

      app.current.style.setProperty('--vx', `${width}px`)
      app.current.style.setProperty('--vy', `${height}px`)
    })
    ro.observe(app.current)

    init({
      app: app.current,
      world: world.current,
      signal,
    })

    invariant(app.current)

    return () => {
      controller.abort()
      ro.disconnect()
    }
  }, [])

  const squares = new Array<JSX.Element>()

  const r = 0

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

class Camera {
  private readonly world: HTMLDivElement

  x: number = 0
  y: number = 0
  zoom: number = 0

  constructor(
    world: HTMLDivElement,
    x: number,
    y: number,
    zoom: number,
  ) {
    this.world = world
    this.setPosition(x, y)
    this.setZoom(zoom)
  }

  setPosition(x: number, y: number) {
    this.x = x
    this.world.style.setProperty('--cx', `${x}`)
    this.y = y
    this.world.style.setProperty('--cy', `${y}`)
  }

  setZoom(zoom: number) {
    invariant(zoom >= 0)
    invariant(zoom <= 1)
    this.zoom = zoom
    this.world.style.setProperty(
      '--zoom',
      `${zoom.toFixed(2)}`,
    )
  }
}

function init({
  app,
  world,
  signal,
}: {
  app: HTMLDivElement
  world: HTMLDivElement
  signal: AbortSignal
}): void {
  const camera = new Camera(world, 0, 0, 0.5)

  app.addEventListener(
    'wheel',
    (ev) => {
      camera.setZoom(
        clamp(camera.zoom - ev.deltaY / 1000, 0, 1),
      )

      ev.preventDefault()
    },
    { signal, passive: false },
  )

  app.addEventListener(
    'pointermove',
    (ev) => {
      if (!ev.buttons) {
        return
      }

      camera.setPosition(
        camera.x + ev.movementX,
        camera.y + ev.movementY,
      )
    },
    { signal },
  )

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
