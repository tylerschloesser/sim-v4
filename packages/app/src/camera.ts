import * as z from 'zod'
import { Vec2 } from './vec2.js'

export const Camera = z.strictObject({
  position: Vec2,
  zoom: z.number().min(0).max(1),
})

export type Camera = z.infer<typeof Camera>

export function loadCamera(): Camera {
  return {
    position: {
      x: 0,
      y: 0,
    },
    zoom: 0.5,
  }
}
