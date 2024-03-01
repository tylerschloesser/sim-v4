import Prando from 'prando'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Vec2, vec2 } from './vec2.js'

export const ItemType = z.enum([
  'IronOre',
  'Stone',
  'Coal',
  'IronPlate',
])
export type ItemType = z.infer<typeof ItemType>

export const EntityType = z.enum([
  'Smelter',
  'Patch',
  'Miner',
])
export type EntityType = z.infer<typeof EntityType>

export const SmelterEntityState = z.strictObject({
  type: z.literal(EntityType.enum.Smelter),
  id: z.string(),
  recipeId: z.string().nullable(),
  smeltTicksRemaining: z
    .number()
    .int()
    .positive()
    .nullable(),
  fuelTicksRemaining: z
    .number()
    .int()
    .positive()
    .nullable(),
})
export type SmelterEntityState = z.infer<
  typeof SmelterEntityState
>

export const SmelterEntity = z.strictObject({
  type: z.literal(EntityType.enum.Smelter),
  id: z.string(),
  position: Vec2,
  inventoryId: z.string(),
  radius: z.literal(0.75),
})
export type SmelterEntity = z.infer<typeof SmelterEntity>

export const PatchEntityState = z.strictObject({
  type: z.literal(EntityType.enum.Patch),
  id: z.string(),
})
export type PatchEntityState = z.infer<
  typeof PatchEntityState
>

export const PatchEntity = z.strictObject({
  type: z.literal(EntityType.enum.Patch),
  id: z.string(),
  position: Vec2,
  inventoryId: z.string(),
  radius: z.literal(0.75),
  itemType: ItemType,
  minerIds: z.record(z.string(), z.literal(true)),
})
export type PatchEntity = z.infer<typeof PatchEntity>

export const MinerEntityState = z.strictObject({
  type: z.literal(EntityType.enum.Miner),
  id: z.string(),
  mineTicksRemaining: z
    .number()
    .int()
    .positive()
    .nullable(),
  fuelTicksRemaining: z
    .number()
    .int()
    .positive()
    .nullable(),
})
export type MinerEntityState = z.infer<
  typeof MinerEntityState
>

export const MinerEntity = z.strictObject({
  type: z.literal(EntityType.enum.Miner),
  id: z.string(),
  position: Vec2,
  inventoryId: z.string(),
  radius: z.literal(0.75),
  patchId: z.string(),
})
export type MinerEntity = z.infer<typeof MinerEntity>

export const EntityState = z.discriminatedUnion('type', [
  SmelterEntityState,
  PatchEntityState,
  MinerEntityState,
])
export type EntityState = z.infer<typeof EntityState>

export const Entity = z.discriminatedUnion('type', [
  SmelterEntity,
  PatchEntity,
  MinerEntity,
])
export type Entity = z.infer<typeof Entity>

export const Cursor = z.strictObject({
  entityId: z.string().nullable(),
  inventoryId: z.string(),
  radius: z.literal(1),
})
export type Cursor = z.infer<typeof Cursor>

export const Inventory = z.strictObject({
  id: z.string(),
  items: z.record(ItemType, z.number()),
})
export type Inventory = z.infer<typeof Inventory>

export const World = z.strictObject({
  tick: z.number().int().nonnegative(),

  cursor: Cursor,
  entities: z.record(z.string(), Entity),
  inventories: z.record(z.string(), Inventory),
  states: z.record(z.string(), EntityState),

  nextEntityId: z.number().int().nonnegative(),
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
  radius: 0.75
  itemType: ItemType
  count: number
}): void {
  const id = `${world.nextEntityId++}`
  invariant(!world.entities[id])
  const inventory: Inventory = {
    id: `${world.nextInventoryId++}`,
    items: {
      [itemType]: count,
    },
  }
  const state: PatchEntityState = {
    id,
    type: EntityType.enum.Patch,
  }
  world.entities[id] = {
    type: EntityType.enum.Patch,
    id,
    position,
    radius,
    inventoryId: inventory.id,
    itemType,
    minerIds: {},
  }
  world.inventories[inventory.id] = inventory
  world.states[state.id] = state
}

function initWorld(seed: string = ''): World {
  const rng = new Prando(seed)

  let nextInventoryId = 0

  const inventory: Inventory = {
    id: `${nextInventoryId++}`,
    items: {},
  }

  const world: World = {
    tick: 0,
    cursor: {
      entityId: null,
      inventoryId: inventory.id,
      radius: 1,
    },
    entities: {},
    states: {},
    nextEntityId: 0,
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

    const position = { x: dist, y: 0 }
    vec2.rotate(position, angle)

    addPatch({
      world,
      position,
      radius: 0.75,
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
