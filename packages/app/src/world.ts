import Prando from 'prando'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Vec2, vec2 } from './vec2.js'

export const ItemType = z.enum(['IronOre', 'Stone', 'Coal'])
export type ItemType = z.infer<typeof ItemType>

export const Patch = z.strictObject({
  id: z.string(),
  inventoryId: z.string(),
  position: Vec2,
  radius: z.number().positive(),
})
export type Patch = z.infer<typeof Patch>

export const Cursor = z.strictObject({
  patchId: z.string().nullable(),
  inventoryId: z.string(),
})
export type Cursor = z.infer<typeof Cursor>

export const Inventory = z.strictObject({
  id: z.string(),
  items: z.record(ItemType, z.number()),
})
export type Inventory = z.infer<typeof Inventory>

export const World = z.strictObject({
  cursor: Cursor,
  patches: z.record(z.string(), Patch),
  inventories: z.record(z.string(), Inventory),

  nextPatchId: z.number().int().nonnegative(),
  nextInventoryId: z.number().int().nonnegative(),
})
export type World = z.infer<typeof World>

function addPatch({
  world,
  position,
  radius,
  itemType,
  count,
}: {
  world: World
  position: Vec2
  radius: number
  itemType: ItemType
  count: number
}): void {
  const id = `${world.nextPatchId++}`
  invariant(!world.patches[id])
  const inventory: Inventory = {
    id: `${world.nextInventoryId++}`,
    items: {
      [itemType]: count,
    },
  }
  world.patches[id] = {
    id,
    position,
    radius,
    inventoryId: inventory.id,
  }
  world.inventories[inventory.id] = inventory
}

function initWorld(seed: string = ''): World {
  const rng = new Prando(seed)

  let nextInventoryId = 0

  const inventory: Inventory = {
    id: `${nextInventoryId++}`,
    items: {},
  }

  const world: World = {
    cursor: {
      patchId: null,
      inventoryId: inventory.id,
    },
    patches: {},
    nextPatchId: 0,
    nextInventoryId,
    inventories: {
      [inventory.id]: inventory,
    },
  }

  function generatePatch(
    angle: number,
    itemType: ItemType,
    count: number,
  ): void {
    const dist = 4 + rng.next() * 4
    const radius = 0.25 + rng.next() * 0.5

    const position = { x: dist, y: 0 }
    vec2.rotate(position, angle)

    addPatch({
      world,
      position,
      radius,
      itemType,
      count,
    })
  }

  // prettier-ignore
  {
    generatePatch(Math.PI * -0.5 * rng.next(), ItemType.enum.Coal, 100)
    generatePatch(Math.PI * 0.5 * rng.next(), ItemType.enum.IronOre, 100)
    generatePatch(Math.PI * -0.5 + Math.PI * -0.5 * rng.next(), ItemType.enum.Stone, 100)
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
