import Prando from 'prando'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { tasks } from './tasks.js'
import {
  Cursor,
  Entity,
  EntityId,
  EntityShape,
  EntityState,
  EntityType,
  ItemType,
  PatchEntityShape,
  PatchEntityState,
  TaskId,
  World,
} from './types.js'
import { Vec2, vec2 } from './vec2.js'

export function initWorld(seed: string = ''): World {
  const rng = new Prando(seed)

  const cursor: Cursor = {
    entityId: null,
    inventory: {
      // [ItemType.enum.Stone]: 1_000,
      // [ItemType.enum.IronPlate]: 1_000,
    },
    radius: 1,
  }

  const world: World = {
    tick: 0,
    cursor,
    shapes: {},
    states: {},
    nextEntityId: 0,
    taskId: TaskId.parse(Object.keys(tasks).at(0)),
  }

  function generatePatch(
    angle: number,
    itemType: ItemType,
    count: number,
  ): void {
    const dist = 16 + rng.next() * 8

    const position = { x: dist, y: 0 }
    vec2.rotate(position, angle)

    const radius = 2 + rng.next() * 2

    addPatch({
      world,
      position,
      radius,
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
  const id = getNextEntityId(world)

  const type = EntityType.enum.Patch

  const shape: PatchEntityShape = {
    id,
    type,
    itemType,
    input: {},
    output: {
      [itemType]: {},
    },
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
    satisfaction: 0,
  }

  world.shapes[id] = shape
  world.states[id] = state
}

export function getNextEntityId(world: World): EntityId {
  const next = `${world.nextEntityId++}`
  invariant(!world.shapes[next])
  invariant(!world.states[next])
  return next
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
