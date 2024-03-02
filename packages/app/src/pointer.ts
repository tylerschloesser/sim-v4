import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Camera } from './camera.js'
import { dist } from './math.js'
import {
  Viewport,
  clampScale,
  getScale,
  scaleToZoom,
} from './viewport.js'

type PointerId = number
const pointerCache = new Map<PointerId, PointerEvent>()

export function handlePointer(
  ev: PointerEvent,
  camera$: BehaviorSubject<Camera>,
  viewport$: BehaviorSubject<Viewport>,
): void {
  if (
    ev.target instanceof HTMLElement &&
    ev.target.dataset['pointer'] === 'capture'
  ) {
    return
  }

  switch (ev.type) {
    case 'pointerout':
    case 'pointerleave':
    case 'pointercancel': {
      pointerCache.delete(ev.pointerId)
      break
    }
    // in safari iOS, there's often a large time delay between
    // the first pointerdown and the next pointermove event,
    // resulting in a "jerky" initial movement
    //
    // case 'pointerdown':
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
        case 2: {
          const other = getLastEventForOtherPointer(ev)
          invariant(other.buttons)
          // prettier-ignore
          handleTwoFingerDrag(prev, ev, other, camera$, viewport$)
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

function handleTwoFingerDrag(
  prev: PointerEvent,
  next: PointerEvent,
  other: PointerEvent,
  camera$: BehaviorSubject<Camera>,
  viewport$: BehaviorSubject<Viewport>,
): void {
  const camera = camera$.value
  const viewport = viewport$.value

  const ox = other.clientX
  const oy = other.clientY
  const px = prev.clientX
  const py = prev.clientY
  const nx = next.clientX
  const ny = next.clientY

  // center of the line between both pointers
  const pcx = ox + (px - ox) / 2
  const pcy = oy + (py - oy) / 2
  const ncx = ox + (nx - ox) / 2
  const ncy = oy + (ny - oy) / 2

  // distance between both pointers
  const pd = dist(px, py, ox, oy)
  const nd = dist(nx, ny, ox, oy)

  const vx = viewport.size.x
  const vy = viewport.size.y

  const prevScale = getScale(camera.zoom, vx, vy)
  // prettier-ignore
  const nextScale = clampScale(prevScale * (nd / pd), vx, vy)

  // how far did the center move, aka how much to move
  // the camera in addition to the change in tile size
  const dcx = ncx - pcx
  const dcy = ncy - pcy

  // the point, relative to the center of the screen,
  // at which the change in position due to change
  // in tile size
  const rx = ncx - vx / 2
  const ry = ncy - vy / 2

  // final camera movement
  const dx = rx / prevScale - (rx + dcx) / nextScale
  const dy = ry / prevScale - (ry + dcy) / nextScale

  camera$.next({
    position: {
      x: camera.position.x + dx,
      y: camera.position.y + dy,
    },
    zoom: scaleToZoom(nextScale, vx, vy),
  })
}

function getLastEventForOtherPointer(
  ev: PointerEvent,
): PointerEvent {
  invariant(pointerCache.size === 2)
  for (const other of pointerCache.values()) {
    if (other.pointerId !== ev.pointerId) {
      return other
    }
  }
  invariant(false)
}
