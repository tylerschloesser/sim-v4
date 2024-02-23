import { memoize } from 'lodash-es'
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
  const container = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(container.current)
    invariant(world.current)

    init({
      container: container.current,
      world: world.current,
      signal,
    })

    invariant(container.current)

    return () => {
      controller.abort()
    }
  }, [])

  const squares = new Array<JSX.Element>()

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      const id = `${x}.${y}`
      squares.push(<Square key={id} id={id} x={x} y={y} />)
    }
  }

  return (
    <div className={styles.app} ref={container}>
      <div className={styles.world} ref={world}>
        {squares}
      </div>
    </div>
  )
}

function init({
  container,
  world,
  signal,
}: {
  container: HTMLDivElement
  world: HTMLDivElement
  signal: AbortSignal
}): void {
  container.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault()
    },
    { signal, passive: false },
  )

  container.addEventListener(
    'pointermove',
    (ev) => {
      if (!ev.buttons) {
        return
      }

      let translateY = parseFloat(
        world.dataset['translateY'] ?? '0',
      )
      translateY += ev.movementY
      world.dataset['translateY'] = `${translateY}`

      let translateX = parseFloat(
        world.dataset['translateX'] ?? '0',
      )
      translateX += ev.movementX
      world.dataset['translateX'] = `${translateX}`

      world.style.setProperty(
        'transform',
        `translate3d(${translateX}px, ${translateY}px, 0)`,
      )
    },
    { signal },
  )

  container.addEventListener('pointerdown', (ev) => {
    if (ev.target instanceof Element) {
      const square = ev.target.closest('[data-id]')
      if (square) {
        invariant(square instanceof HTMLElement)
        const id = square.dataset['id']
        invariant(id)
        console.log(`id: ${id}`)
      }
    }
  })
}
