import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Vec2 } from './vec2.js'

export const Patch = z.strictObject({
  id: z.string(),
  position: Vec2,
  radius: z.number().positive(),
  count: z.number().positive(),
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
  count = 100,
}: {
  world: World
  position: Vec2
  radius: number
  count?: number
}): void {
  const id = `${world.nextPatchId++}`
  invariant(!world.patches[id])
  world.patches[id] = {
    id,
    position,
    radius,
    count,
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
    radius: 0.75,
  })

  addPatch({
    world,
    position: { x: 0, y: -1 },
    radius: 0.5,
  })

  return world
}

export function loadWorld(): World {
  const saved = localStorage.getItem('world')
  if (saved) {
    return World.parse(JSON.parse(saved))
  }
  return initWorld()
}

export function saveWorld(world: World) {
  World.parse(world)
  localStorage.setItem('world', JSON.stringify(world))
}
