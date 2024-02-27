import invariant from 'tiny-invariant'
import * as z from 'zod'

export const Vec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type Vec2 = z.infer<typeof Vec2>

function reset(v: Vec2): void {
  v.x = 0
  v.y = 0
}

function copy(a: Vec2, b: Vec2): void {
  a.x = b.x
  a.y = b.y
}

function clone(v: Vec2): Vec2 {
  return { x: v.x, y: v.y }
}

function rotate(v: Vec2, angle: number): void {
  const x = v.x * Math.cos(angle) - v.y * Math.sin(angle)
  const y = v.x * Math.sin(angle) + v.y * Math.cos(angle)
  v.x = x
  v.y = y
}

function add(a: Vec2, b: Vec2): void {
  a.x += b.x
  a.y += b.y
}

function sub(a: Vec2, b: Vec2): void {
  a.x -= b.x
  a.y -= b.y
}

function mul(v: Vec2, s: number): void {
  v.x *= s
  v.y *= s
}

function div(v: Vec2, s: number): void {
  v.x /= s
  v.y /= s
}

function len(x: number, y: number): number
function len(v: Vec2): number
function len(a: Vec2 | number, b?: number): number {
  if (typeof a === 'number') {
    invariant(typeof b === 'number')
    return Math.sqrt(a ** 2 + b ** 2)
  }
  return Math.sqrt(a.x ** 2 + a.y ** 2)
}

function norm(v: Vec2): void {
  div(v, len(v))
}

export const vec2 = {
  reset,
  copy,
  clone,
  rotate,
  add,
  sub,
  mul,
  div,
  len,
  norm,
}
