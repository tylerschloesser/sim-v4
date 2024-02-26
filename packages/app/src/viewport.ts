import invariant from 'tiny-invariant'
import { Vec2 } from './vec2.js'

export interface Viewport {
  size: Vec2
  dpr: number
}

export function getMinScale(
  vx: number,
  vy: number,
): number {
  const vmin = Math.min(vx, vy)
  const minScale = vmin * 0.1
  return minScale
}

export function getMaxScale(
  vx: number,
  vy: number,
): number {
  const vmin = Math.min(vx, vy)
  const maxScale = vmin * 0.5
  return maxScale
}

export function getScale(
  zoom: number,
  vx: number,
  vy: number,
): number {
  invariant(zoom >= 0)
  invariant(zoom <= 1)

  invariant(vx !== 0)
  invariant(vy !== 0)

  const minScale = getMinScale(vx, vy)
  const maxScale = getMaxScale(vx, vy)
  return minScale + (maxScale - minScale) * zoom
}
