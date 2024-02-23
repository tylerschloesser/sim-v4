import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'

export function App() {
  const container = useRef<HTMLDivElement>(null)
  const square = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    invariant(container.current)

    container.current.addEventListener(
      'wheel',
      (ev) => {
        ev.preventDefault()
      },
      { signal, passive: false },
    )

    container.current.addEventListener(
      'pointermove',
      (ev) => {
        invariant(square.current)
        if (!ev.buttons) {
          return
        }

        let translateY = parseFloat(
          square.current.dataset['translateY'] ?? '0',
        )
        translateY += ev.movementY
        square.current.dataset['translateY'] =
          `${translateY}`

        let translateX = parseFloat(
          square.current.dataset['translateX'] ?? '0',
        )
        translateX += ev.movementX
        square.current.dataset['translateX'] =
          `${translateX}`

        square.current.style.setProperty(
          'transform',
          `translate3d(${translateX}px, ${translateY}px, 0)`,
        )

        ev.preventDefault()
      },
      { signal },
    )

    invariant(square.current)
    square.current.addEventListener(
      'pointerdown',
      () => {
        console.log('hit square')
      },
      { signal },
    )

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className={styles.app} ref={container}>
      <div className={styles.square} ref={square}></div>
    </div>
  )
}
