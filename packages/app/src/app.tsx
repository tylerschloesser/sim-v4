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

function newCamera(world: HTMLDivElement) {
  return new Proxy(
    {
      x: 0,
      y: 0,
      zoom: 0,
    },
    {
      set(target, prop, value) {
        switch (prop) {
          case 'x':
            target.x = value
            world.style.setProperty(
              '--cx',
              `${target.x.toFixed(2)}px`,
            )
            break
          case 'y':
            target.y = value
            world.style.setProperty(
              '--cy',
              `${target.y.toFixed(2)}px`,
            )
            break
          case 'zoom':
            target.zoom = value
            world.style.setProperty(
              '--zoom',
              `${target.zoom.toFixed(2)}`,
            )
            break
          default:
            invariant(false)
        }
        return true
      },
    },
  )
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
  const camera = newCamera(world)

  camera.x = 0.5
  camera.y = 0.5
  camera.zoom = 0.5

  app.addEventListener(
    'wheel',
    (ev) => {
      camera.zoom = clamp(
        camera.zoom - ev.deltaY / 1000,
        0,
        1,
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

      camera.x += ev.movementX
      camera.y += ev.movementY
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
