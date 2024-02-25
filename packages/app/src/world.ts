import invariant from 'tiny-invariant'
import * as z from 'zod'

export const Vec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type Vec2 = z.infer<typeof Vec2>

export const Patch = z.strictObject({
  id: z.string(),
  position: Vec2,
  radius: z.number().positive(),
})
export type Patch = z.infer<typeof Patch>

export const World = z.strictObject({
  patches: z.record(z.string(), Patch),
  nextPatchId: z.number().int().nonnegative(),
})
export type World = z.infer<typeof World>

function addPatch({
  world,
  position,
  radius,
}: {
  world: World
  position: Vec2
  radius: number
}): void {
  const id = `${world.nextPatchId++}`
  invariant(!world.patches[id])
  world.patches[id] = {
    id,
    position,
    radius,
  }
}

function initWorld(): World {
  const world: World = {
    patches: {},
    nextPatchId: 0,
  }

  addPatch({
    world,
    position: { x: 1, y: 2 },
    radius: 1,
  })

  return world
}

export function loadWorld(): World {
  return initWorld()
}
