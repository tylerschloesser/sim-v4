import { Vec2 } from './vec2.js'

export interface Viewport {
  size: Vec2
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
