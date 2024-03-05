import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { isConnectAllowed } from './connect.js'
import { deleteEmptyPatch } from './delete.js'
import { inventoryMove, inventorySub } from './inventory.js'
import { entityRecipes } from './recipe.js'
import { Vec2 } from './vec2.js'
import {
  ConnectionType,
  Connections,
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

    const itemType = (() => {
      const keys = Object.keys(patch.state.output)
      invariant(keys.length === 1)
      return ItemType.parse(keys.at(0))
    })()

    inventoryMove(
      patch.state.output,
      world.cursor.inventory,
      { [itemType]: 1 },
    )

    const isPatchEmpty = (() => {
      const keys = Object.keys(patch.state.output)
      invariant(keys.length <= 1)
      return keys.length === 0
    })()

    if (isPatchEmpty) {
      deleteEmptyPatch(world, patch.id)
    }
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
  connections: Connections,
  input: EntityShape['input'],
  output: EntityShape['output'],
): void {
  const recipe = entityRecipes[entityType]
  invariant(recipe)

  console.log('before set world')
  setWorld((world) => {
    console.log('in set world')
    inventorySub(world.cursor.inventory, recipe.input)

    const id = getNextEntityId(world)

    for (const key of Object.keys(output)) {
      const outputType = ItemType.parse(key)
      if (input[outputType]) {
        // connect this entity to itself
        invariant(
          Object.keys(input[outputType]!).length === 0,
        )
        input = { ...input }
        output = { ...output }
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
          connections,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Miner,
          id,
          fuelTicksRemaining: null,
          mineTicksRemaining: null,
          input: {},
          output: {},
        }
        break
      }
      case EntityType.enum.Smelter: {
        world.shapes[id] = {
          type: EntityType.enum.Smelter,
          id,
          itemType,
          connections,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Smelter,
          id,
          recipeId: null,
          fuelTicksRemaining: null,
          smeltTicksRemaining: null,
          input: {},
          output: {},
        }
        break
      }
      case EntityType.enum.Generator: {
        world.shapes[id] = {
          type: EntityType.enum.Generator,
          id,
          itemType,
          connections,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Generator,
          id,
          fuelTicksRemaining: null,
          input: {},
          output: {},
        }
        break
      }
      case EntityType.enum.Crafter: {
        world.shapes[id] = {
          type: EntityType.enum.Crafter,
          id,
          itemType,
          connections,
          input,
          output,
          position,
          radius: 0.75,
        }
        world.states[id] = {
          type: EntityType.enum.Crafter,
          id,
          craftTicksRemaining: null,
          recipeId: null,
          input: {},
          output: {},
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
        const peer = getEntity(world, peerId)
        const value = peer.shape.input[itemType]
        invariant(value)
        invariant(!value[id])
        value[id] = true
      }
    }

    for (const [peerId, type] of Object.entries(
      connections,
    )) {
      const peer = getEntity(world, peerId)
      invariant(!peer.shape.connections[id])
      peer.shape.connections[id] = type
    }
  })
}

export function addConnection(
  setWorld: Updater<World>,
  sourceId: EntityId,
  targetId: EntityId,
): void {
  setWorld((world) => {
    const source = getEntity(world, sourceId)
    const target = getEntity(world, targetId)

    invariant(!source.shape.connections[targetId])
    invariant(!target.shape.connections[sourceId])

    invariant(
      isConnectAllowed(
        source.shape,
        target.shape,
        world.shapes,
      ),
    )

    const connectionType = ConnectionType.enum.Item
    source.shape.connections[targetId] = connectionType
    target.shape.connections[sourceId] = connectionType
  })
}

export function removeConnection(
  setWorld: Updater<World>,
  sourceId: EntityId,
  targetId: EntityId,
): void {
  setWorld((world) => {
    const source = getEntity(world, sourceId)
    const target = getEntity(world, targetId)

    invariant(source.shape.connections[targetId])
    invariant(target.shape.connections[sourceId])

    delete source.shape.connections[targetId]
    delete target.shape.connections[sourceId]
  })
}
