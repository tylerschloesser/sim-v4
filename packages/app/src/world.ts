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

export const Pickaxe = z.strictObject({
  patchId: z.string().nullable(),
  radius: z.number().positive(),
})
export type Pickaxe = z.infer<typeof Pickaxe>

export const World = z.strictObject({
  pickaxe: Pickaxe,
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
    pickaxe: {
      patchId: null,
      radius: 0.25,
    },
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
    try {
      return World.parse(JSON.parse(saved))
    } catch (e) {
      if (e instanceof z.ZodError) {
        if (self.confirm('Failed to parse world. Reset?')) {
          localStorage.clear()
          self.location.reload()
        }
      }
      throw e
    }
  }
  return initWorld()
}

export function saveWorld(world: World) {
  World.parse(world)
  localStorage.setItem('world', JSON.stringify(world))
}
