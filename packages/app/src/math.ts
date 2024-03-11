import invariant from 'tiny-invariant'

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

export function dist(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export function smooth(k: number, pow: number = 3) {
  invariant(k >= 0)
  invariant(k <= 1)
  return 1 - (1 - k) ** pow
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}
