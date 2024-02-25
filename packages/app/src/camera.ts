import * as z from 'zod'
import { Vec2 } from './vec2.js'

export const Camera = z.strictObject({
  position: Vec2,
  zoom: z.number().min(0).max(1),
})

export type Camera = z.infer<typeof Camera>

export function loadCamera(): Camera {
  const saved = localStorage.getItem('camera')
  if (saved) {
    return Camera.parse(JSON.parse(saved))
  }
  return {
    position: {
      x: 0,
      y: 0,
    },
    zoom: 1,
  }
}

export function saveCamera(camera: Camera): void {
  Camera.parse(camera)
  localStorage.setItem('camera', JSON.stringify(camera))
}
