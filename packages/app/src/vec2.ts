import * as z from 'zod'

export const Vec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type Vec2 = z.infer<typeof Vec2>

export function rotate(v: Vec2, angle: number): void {
  const x = v.x * Math.cos(angle) - v.y * Math.sin(angle)
  const y = v.x * Math.sin(angle) + v.y * Math.cos(angle)
  v.x = x
  v.y = y
}

export function add(a: Vec2, b: Vec2): void {
  a.x += b.x
  a.y += b.y
}

export function sub(a: Vec2, b: Vec2): void {
  a.x -= b.x
  a.y -= b.y
}

export function mul(v: Vec2, s: number): void {
  v.x *= s
  v.y *= s
}

export function div(v: Vec2, s: number): void {
  v.x /= s
  v.y /= s
}

export function len(v: Vec2): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2)
}

export function norm(v: Vec2): void {
  div(v, len(v))
}
