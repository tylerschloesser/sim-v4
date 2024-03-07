import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  inventoryAdd,
  inventoryMove,
  inventorySub,
} from './inventory.js'
import { entityRecipes } from './recipe.js'
import { Vec2 } from './vec2.js'
import {
  EntityId,
  EntityShape,
  EntityType,
  Inventory,
  ItemType,
  World,
  getEntity,
  getNextEntityId,
} from './world.js'

export function moveFromEntityOutputToCursor(
  setWorld: Updater<World>,
  entityId: EntityId,
  items?: Inventory,
): void {
  setWorld((world) => {
    const entity = getEntity(world, entityId)

    // TODO define which entities this can be done on
    invariant(entity.type !== EntityType.enum.Patch)

    inventoryMove(
      entity.state.output,
      world.cursor.inventory,
      items,
    )
  })
}

export function minePatch(
  setWorld: Updater<World>,
  patchId: EntityId,
): void {
  setWorld((world) => {
    const patch = getEntity(world, patchId)
    invariant(patch.type === EntityType.enum.Patch)

    const mineableType = (() => {
      const keys = Object.keys(patch.state.output)
      invariant(keys.length === 1)
      return ItemType.parse(keys.at(0))
    })()

    const itemType = (() => {
      switch (mineableType) {
        case ItemType.enum.MineableCoal:
          return ItemType.enum.Coal
        case ItemType.enum.MineableStone:
          return ItemType.enum.Stone
        case ItemType.enum.MineableIronOre:
          return ItemType.enum.IronOre
        default:
          invariant(false)
      }
    })()

    inventorySub(patch.state.output, {
      [mineableType]: 1,
    })
    inventoryAdd(world.cursor.inventory, { [itemType]: 1 })
  })
}

export function moveFromCursorToEntityInput(
  setWorld: Updater<World>,
  entityId: EntityId,
  items: Inventory,
): void {
  setWorld((world) => {
    const entity = getEntity(world, entityId)
    inventoryMove(
      world.cursor.inventory,
      entity.state.input,
      items,
    )
  })
}

export function buildEntity(
  setWorld: Updater<World>,
  entityType: EntityType,
  itemType: ItemType,
  position: Vec2,
  input: EntityShape['input'],
  output: EntityShape['output'],
): void {
  const recipe = entityRecipes[entityType]
  invariant(recipe)

  setWorld((world) => {
    inventorySub(world.cursor.inventory, recipe.input)

    const id = getNextEntityId(world)

    // check if this build is a closer output to other inputs,
    // in which case we start by removing the existing connections
    for (const [key, value] of Object.entries(output)) {
      const itemType = ItemType.parse(key)
      for (const peerId of Object.keys(value)) {
        const peer = world.shapes[peerId]
        invariant(peer)

        if (peer.input[itemType]) {
          invariant(
            Object.keys(peer.input[itemType]!).length <= 1,
          )
          const peerPeerId = Object.keys(
            peer.input[itemType]!,
          ).at(0)
          if (peerPeerId) {
            const peerPeer = world.shapes[peerPeerId]
            invariant(peerPeer)
            invariant(peerPeer.output[itemType]![peerId])
            delete peerPeer.output[itemType]![peerId]
            delete peer.input[itemType]![peerPeerId]
          }
        }
      }
    }

    for (const key of Object.keys(output)) {
      const outputType = ItemType.parse(key)
      if (input[outputType]) {
        // connect this entity to itself
        invariant(
          Object.keys(input[outputType]!).length === 0,
        )
        input[outputType]![id] = true
        output[outputType]![id] = true
      }
    }

    switch (entityType) {
      case EntityType.enum.Miner: {
        world.shapes[id] = {
          type: EntityType.enum.Miner,
          id,
          itemType,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Miner,
          id,
          input: {},
          output: {},
          satisfaction: 0,
        }
        break
      }
      case EntityType.enum.Smelter: {
        world.shapes[id] = {
          type: EntityType.enum.Smelter,
          id,
          itemType,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Smelter,
          id,
          input: {},
          output: {},
          satisfaction: 0,
        }
        break
      }
      case EntityType.enum.Generator: {
        world.shapes[id] = {
          type: EntityType.enum.Generator,
          id,
          itemType,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Generator,
          id,
          input: {},
          output: {},
          satisfaction: 0,
        }
        break
      }
      case EntityType.enum.Crafter: {
        world.shapes[id] = {
          type: EntityType.enum.Crafter,
          id,
          itemType,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Crafter,
          id,
          input: {},
          output: {},
          satisfaction: 0,
        }
        break
      }
      default: {
        invariant(false)
      }
    }

    for (const [key, peerIds] of Object.entries(input)) {
      const itemType = ItemType.parse(key)
      for (const peerId of Object.keys(peerIds)) {
        if (peerId === id) {
          // TODO validate
          continue
        }

        const peer = getEntity(world, peerId)
        const value = peer.shape.output[itemType]
        invariant(value)
        invariant(!value[id])
        value[id] = true
      }
    }

    for (const [key, peerIds] of Object.entries(output)) {
      const itemType = ItemType.parse(key)
      for (const peerId of Object.keys(peerIds)) {
        if (peerId === id) {
          // TODO validate
          continue
        }

        const peer = getEntity(world, peerId)
        const value = peer.shape.input[itemType]
        invariant(value)
        invariant(!value[id])
        value[id] = true
      }
    }
  })
}
