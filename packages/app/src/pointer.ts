import { BehaviorSubject } from 'rxjs'
import { Camera } from './camera.js'
import { Viewport, getScale } from './viewport.js'

type PointerId = number
const pointerCache = new Map<PointerId, PointerEvent>()

export function handlePointer(
  ev: PointerEvent,
  camera$: BehaviorSubject<Camera>,
  viewport$: BehaviorSubject<Viewport>,
): void {
  switch (ev.type) {
    case 'pointerout':
    case 'pointerleave':
    case 'pointercancel': {
      pointerCache.delete(ev.pointerId)
      break
    }
    case 'pointerdown':
    case 'pointermove': {
      const prev = pointerCache.get(ev.pointerId)
      pointerCache.set(ev.pointerId, ev)
      if (!ev.buttons || !prev?.buttons) {
        break
      }
      switch (pointerCache.size) {
        case 1: {
          handleOneFingerDrag(prev, ev, camera$, viewport$)
          break
        }
      }
      break
    }
  }

  if (!ev.buttons) {
    return
  }
}

function handleOneFingerDrag(
  prev: PointerEvent,
  next: PointerEvent,
  camera$: BehaviorSubject<Camera>,
  viewport$: BehaviorSubject<Viewport>,
): void {
  const camera = camera$.value
  const viewport = viewport$.value
  const scale = getScale(
    camera.zoom,
    viewport.size.x,
    viewport.size.y,
  )

  const dx = -(next.clientX - prev.clientX) / scale
  const dy = -(next.clientY - prev.clientY) / scale

  camera$.next({
    ...camera,
    position: {
      x: camera.position.x + dx,
      y: camera.position.y + dy,
    },
  })
}
