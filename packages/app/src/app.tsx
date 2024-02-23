import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'

export function App() {
  const container = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const square = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(container.current)
    invariant(world.current)
    invariant(square.current)

    init({
      container: container.current,
      world: world.current,
      square: square.current,
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
        <div className={styles.square} ref={square} />
      </div>
    </div>
  )
}

function init({
  container,
  world,
  square,
  signal,
}: {
  container: HTMLDivElement
  world: HTMLDivElement
  square: HTMLDivElement
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
        square.dataset['translateY'] ?? '0',
      )
      translateY += ev.movementY
      square.dataset['translateY'] = `${translateY}`

      let translateX = parseFloat(
        square.dataset['translateX'] ?? '0',
      )
      translateX += ev.movementX
      square.dataset['translateX'] = `${translateX}`

      square.style.setProperty(
        'transform',
        `translate3d(${translateX}px, ${translateY}px, 0)`,
      )

      ev.preventDefault()
    },
    { signal },
  )

  square.addEventListener(
    'pointerdown',
    () => {
      console.log('hit square')
    },
    { signal },
  )
}
