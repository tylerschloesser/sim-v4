import Prando from 'prando'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Vec2, vec2 } from './vec2.js'

export const ItemType = z.enum(['IronOre'])
export type ItemType = z.infer<typeof ItemType>

export const Patch = z.strictObject({
  id: z.string(),
  position: Vec2,
  radius: z.number().positive(),
  count: z.number().positive(),
})
export type Patch = z.infer<typeof Patch>

export const Cursor = z.strictObject({
  patchId: z.string().nullable(),
})
export type Cursor = z.infer<typeof Cursor>

export const World = z.strictObject({
  cursor: Cursor,
  patches: z.record(z.string(), Patch),
  nextPatchId: z.number().int().nonnegative(),
  inventory: z.record(ItemType, z.number()),
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

function initWorld(seed: string = ''): World {
  const rng = new Prando(seed)

  const world: World = {
    cursor: {
      patchId: null,
    },
    patches: {},
    nextPatchId: 0,
    inventory: {
      [ItemType.enum.IronOre]: 0,
    },
  }

  function generatePatch(angle: number): void {
    const dist = 4 + rng.next() * 4
    const radius = 0.25 + rng.next() * 0.5

    const position = { x: dist, y: 0 }
    vec2.rotate(position, angle)

    addPatch({
      world,
      position,
      radius,
    })
  }

  // prettier-ignore
  {
    generatePatch(Math.PI * -0.5 * rng.next())
    generatePatch(Math.PI * 0.5 * rng.next())
    generatePatch(Math.PI * -0.5 + Math.PI * -0.5 * rng.next())
    generatePatch(Math.PI * 0.5 + Math.PI * 0.5 * rng.next())
  }

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
