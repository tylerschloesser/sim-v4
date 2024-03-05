import Prando from 'prando'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Vec2, vec2 } from './vec2.js'

export const EntityId = z.string()
export type EntityId = z.infer<typeof EntityId>

export const ItemType = z.enum([
  'MineableCoal',
  'MineableIronOre',
  'MineableStone',

  'Coal',
  'IronOre',
  'Stone',

  'IronPlate',
])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const EntityType = z.enum([
  'Smelter',
  'Patch',
  'Miner',
  'Generator',
  'Crafter',
])
export type EntityType = z.infer<typeof EntityType>

export const ConnectionType = z.enum(['Item', 'Power'])
export type ConnectionType = z.infer<typeof ConnectionType>

export const Connections = z.record(
  EntityId,
  ConnectionType,
)
export type Connections = z.infer<typeof Connections>

const EntityShapeBase = z.strictObject({
  id: EntityId,
  position: Vec2,
  radius: z.literal(0.75),

  connections: Connections,

  input: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
  output: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
})

const EntityStateBase = z.strictObject({
  id: EntityId,
  input: Inventory,
  output: Inventory,
})

//
// Smelter
//
export const SmelterEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Smelter),
})
export type SmelterEntityShape = z.infer<
  typeof SmelterEntityShape
>
// prettier-ignore
export const SmelterEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Smelter),
  recipeId: z.string().nullable(),
  smeltTicksRemaining: z.number().int().positive().nullable(),
  fuelTicksRemaining: z.number().int().positive().nullable(),
})
export type SmelterEntityState = z.infer<
  typeof SmelterEntityState
>
export const SmelterEntity = z.strictObject({
  type: z.literal(EntityType.enum.Smelter),
  id: EntityId,
  shape: SmelterEntityShape,
  state: SmelterEntityState,
})
export type SmelterEntity = z.infer<typeof SmelterEntity>

//
// Patch
//
export const PatchEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Patch),
})
export type PatchEntityShape = z.infer<
  typeof PatchEntityShape
>
export const PatchEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Patch),
})
export type PatchEntityState = z.infer<
  typeof PatchEntityState
>
export const PatchEntity = z.strictObject({
  type: z.literal(EntityType.enum.Patch),
  id: EntityId,
  shape: PatchEntityShape,
  state: PatchEntityState,
})
export type PatchEntity = z.infer<typeof PatchEntity>

//
// Miner
//
export const MinerEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Miner),
})
export type MinerEntityShape = z.infer<
  typeof MinerEntityShape
>
// prettier-ignore
export const MinerEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Miner),
  mineTicksRemaining: z.number().int().positive().nullable(),
  fuelTicksRemaining: z.number().int().positive().nullable(),
})
export type MinerEntityState = z.infer<
  typeof MinerEntityState
>
export const MinerEntity = z.strictObject({
  type: z.literal(EntityType.enum.Miner),
  id: EntityId,
  shape: MinerEntityShape,
  state: MinerEntityState,
})
export type MinerEntity = z.infer<typeof MinerEntity>

//
// Generator
//
export const GeneratorEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Generator),
})
export type GeneratorEntityShape = z.infer<
  typeof GeneratorEntityShape
>
// prettier-ignore
export const GeneratorEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Generator),
  fuelTicksRemaining: z.number().int().positive().nullable(),
})
export type GeneratorEntityState = z.infer<
  typeof GeneratorEntityState
>
export const GeneratorEntity = z.strictObject({
  type: z.literal(EntityType.enum.Generator),
  id: EntityId,
  shape: GeneratorEntityShape,
  state: GeneratorEntityState,
})
export type GeneratorEntity = z.infer<
  typeof GeneratorEntity
>

//
// Crafter
//
export const CrafterEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Crafter),
})
export type CrafterEntityShape = z.infer<
  typeof CrafterEntityShape
>
// prettier-ignore
export const CrafterEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Crafter),
  recipeId: z.string().nullable(),
  craftTicksRemaining: z.number().int().positive().nullable(),
})
export type CrafterEntityState = z.infer<
  typeof CrafterEntityState
>
export const CrafterEntity = z.strictObject({
  type: z.literal(EntityType.enum.Crafter),
  id: EntityId,
  shape: CrafterEntityShape,
  state: CrafterEntityState,
})
export type CrafterEntity = z.infer<typeof CrafterEntity>

export const EntityShape = z.discriminatedUnion('type', [
  SmelterEntityShape,
  PatchEntityShape,
  MinerEntityShape,
  GeneratorEntityShape,
  CrafterEntityShape,
])
export type EntityShape = z.infer<typeof EntityShape>

export const EntityState = z.discriminatedUnion('type', [
  SmelterEntityState,
  PatchEntityState,
  MinerEntityState,
  GeneratorEntityState,
  CrafterEntityState,
])
export type EntityState = z.infer<typeof EntityState>

export const Entity = z.discriminatedUnion('type', [
  SmelterEntity,
  PatchEntity,
  MinerEntity,
  GeneratorEntity,
  CrafterEntity,
])
export type Entity = z.infer<typeof Entity>

export const Cursor = z.strictObject({
  entityId: EntityId.nullable(),
  inventory: Inventory,
  radius: z.literal(1),
})
export type Cursor = z.infer<typeof Cursor>

export const World = z.strictObject({
  tick: z.number().int().nonnegative(),

  cursor: Cursor,

  shapes: z.record(EntityId, EntityShape),
  states: z.record(EntityId, EntityState),

  nextEntityId: z.number().int().nonnegative(),
})
export type World = z.infer<typeof World>

export function getNextEntityId(world: World): EntityId {
  const next = `${world.nextEntityId++}`
  invariant(!world.shapes[next])
  invariant(!world.states[next])
  return next
}

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
  const id = getNextEntityId(world)

  const type = EntityType.enum.Patch

  const shape: PatchEntityShape = {
    id,
    type,
    connections: {},
    input: {},
    output: {},
    position,
    radius,
  }

  const state: PatchEntityState = {
    id,
    type,
    input: {},
    output: {
      [itemType]: count,
    },
  }

  world.shapes[id] = shape
  world.states[id] = state
}

function initWorld(seed: string = ''): World {
  const rng = new Prando(seed)

  const cursor: Cursor = {
    entityId: null,
    inventory: {
      [ItemType.enum.Stone]: 1_000,
      [ItemType.enum.IronPlate]: 1_000,
    },
    radius: 1,
  }

  const world: World = {
    tick: 0,
    cursor,
    shapes: {},
    states: {},
    nextEntityId: 0,
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

  {
    const count = 1_000
    generatePatch(
      Math.PI * -0.5 * rng.next(),
      ItemType.enum.MineableCoal,
      count,
    )
    generatePatch(
      Math.PI * 0.5 * rng.next(),
      ItemType.enum.MineableIronOre,
      count,
    )
    generatePatch(
      Math.PI * -0.5 + Math.PI * -0.5 * rng.next(),
      ItemType.enum.MineableStone,
      count,
    )
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

const entityCache = new Map<EntityId, Entity>()
function cacheEntity(
  shape: EntityShape,
  state: EntityState,
): Entity {
  const id = shape.id
  invariant(state.id === id)

  const type = shape.type
  invariant(state.type === shape.type)

  const cached = entityCache.get(id)
  if (cached) {
    invariant(cached.type === type)
    if (cached.state === state && cached.shape === shape) {
      return cached
    }
  }

  let entity: Entity
  switch (type) {
    case EntityType.enum.Miner:
      invariant(shape.type === type)
      invariant(state.type === type)
      entity = { type, id, shape, state }
      break
    case EntityType.enum.Patch:
      invariant(shape.type === type)
      invariant(state.type === type)
      entity = { type, id, shape, state }
      break
    case EntityType.enum.Smelter:
      invariant(shape.type === type)
      invariant(state.type === type)
      entity = { type, id, shape, state }
      break
    case EntityType.enum.Generator:
      invariant(shape.type === type)
      invariant(state.type === type)
      entity = { type, id, shape, state }
      break
    case EntityType.enum.Crafter:
      invariant(shape.type === type)
      invariant(state.type === type)
      entity = { type, id, shape, state }
      break
    default:
      invariant(false)
  }

  entityCache.set(id, entity)
  return entity
}

export function getEntity(
  world: World,
  entityId: EntityId,
): Entity {
  const shape = world.shapes[entityId]
  invariant(shape)
  const state = world.states[entityId]
  invariant(state)

  // if shape and state don't change, return the same
  // object so we can memoize react components
  return cacheEntity(shape, state)
}
