import { BehaviorSubject } from 'rxjs'
import { Camera } from './camera.js'
import { Viewport, getScale } from './viewport.js'

export function handlePointer(
  ev: PointerEvent,
  camera$: BehaviorSubject<Camera>,
  viewport$: BehaviorSubject<Viewport>,
): void {
  if (!ev.buttons) {
    return
  }
  const dx = -ev.movementX
  const dy = -ev.movementY

  const camera = camera$.value
  const viewport = viewport$.value
  const scale = getScale(
    camera.zoom,
    viewport.size.x,
    viewport.size.y,
  )

  camera$.next({
    ...camera,
    position: {
      x: camera.position.x + dx / scale,
      y: camera.position.y + dy / scale,
    },
  })
}
