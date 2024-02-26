import { clamp } from 'lodash-es'
import { BehaviorSubject } from 'rxjs'
import { Camera } from './camera.js'
import { Viewport, getScale } from './viewport.js'

export function handleWheel({
  ev,
  camera$,
  viewport$,
}: {
  ev: WheelEvent
  camera$: BehaviorSubject<Camera>
  viewport$: BehaviorSubject<Viewport>
}): void {
  const camera = camera$.value
  const viewport = viewport$.value

  const vx = viewport.size.x
  const vy = viewport.size.y

  const prevZoom = camera.zoom
  // prettier-ignore
  const nextZoom = clamp(prevZoom + -ev.deltaY / 1000, 0, 1)

  if (nextZoom === prevZoom) {
    return
  }

  // TODO need to adjust if the app is not the entire viewport
  const rx = ev.clientX - vx / 2
  const ry = ev.clientY - vy / 2

  const prevScale = getScale(prevZoom, vx, vy)
  const nextScale = getScale(nextZoom, vx, vy)

  const dx = rx / prevScale - rx / nextScale
  const dy = ry / prevScale - ry / nextScale

  camera$.next({
    position: {
      x: camera.position.x + dx,
      y: camera.position.y + dy,
    },
    zoom: nextZoom,
  })
}
