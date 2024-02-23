import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'

interface SquareProps {
  x: number
  y: number
}

function Square({ x, y }: SquareProps) {
  const id = `${x}.${y}`
  return (
    <div
      className={styles.square}
      data-id={id}
      style={
        {
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

  return (
    <div className={styles.app} ref={container}>
      <div className={styles.world} ref={world}>
        <Square x={0} y={0} />
        <Square x={1} y={0} />
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

      ev.preventDefault()
    },
    { signal },
  )
}
