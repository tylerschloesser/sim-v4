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
