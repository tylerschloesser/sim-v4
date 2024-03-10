import Prando from 'prando'
import { tasks } from './tasks.js'
import { Vec2, vec2 } from './vec2.js'
import {
  Cursor,
  EntityType,
  ItemType,
  PatchEntityShape,
  PatchEntityState,
  TaskId,
  World,
  getNextEntityId,
} from './world.js'

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
