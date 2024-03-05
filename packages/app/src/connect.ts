import invariant from 'tiny-invariant'
import { hasConnectedPatch } from './miner.js'
import { ItemRecipe } from './recipe.js'
import { Vec2, vec2 } from './vec2.js'
import { ConnectAction } from './view.js'
import {
  EntityId,
  EntityShape,
  EntityType,
  ItemType,
  World,
} from './world.js'

export function isDisconnectAllowed(
  source: EntityShape,
  target: EntityShape,
): boolean {
  if (source.connections[target.id]) {
    invariant(target.connections[source.id])
    return true
  }
  return false
}

export function isConnectAllowed(
  source: EntityShape,
  target: EntityShape | null,
  shapes: World['shapes'],
): boolean {
  if (target === null) {
    return false
  }

  if (source.id === target.id) {
    return false
  }

  if (source.connections[target.id]) {
    invariant(target.connections[source.id])
    return false
  }

  switch (source.type) {
    case EntityType.enum.Miner: {
      switch (target.type) {
        case EntityType.enum.Patch: {
          if (hasConnectedPatch(source, shapes)) {
            return false
          }
          return true
        }
        case EntityType.enum.Smelter: {
          return true
        }
        case EntityType.enum.Miner: {
          return true
        }
      }
      break
    }
    case EntityType.enum.Patch: {
      switch (target.type) {
        case EntityType.enum.Miner: {
          if (hasConnectedPatch(target, shapes)) {
            return false
          }
          return true
        }
      }
      break
    }
    case EntityType.enum.Smelter: {
      switch (target.type) {
        case EntityType.enum.Crafter:
        case EntityType.enum.Miner: {
          return true
        }
      }
      break
    }
    case EntityType.enum.Generator: {
      switch (target.type) {
        case EntityType.enum.Miner:
        case EntityType.enum.Crafter:
          return true
      }
      break
    }
    case EntityType.enum.Crafter: {
      switch (target.type) {
        case EntityType.enum.Generator:
        case EntityType.enum.Smelter: {
          return true
        }
      }
      break
    }
  }

  return false
}

export function getConnectAction(
  source: EntityShape,
  target: EntityShape | null,
  shapes: World['shapes'],
): ConnectAction | null {
  if (target === null) {
    return null
  }

  if (isDisconnectAllowed(source, target)) {
    return ConnectAction.enum.Disconnect
  } else if (isConnectAllowed(source, target, shapes)) {
    return ConnectAction.enum.Connect
  }
  return null
}

export function getInputOutput(
  recipe: ItemRecipe,
  position: Vec2,
  shapes: World['shapes'],
): {
  input: Partial<Record<ItemType, Record<EntityId, true>>>
  output: Partial<Record<ItemType, Record<EntityId, true>>>
} {
  const dists = new Map<EntityId, number>()
  for (const shape of Object.values(shapes)) {
    dists.set(shape.id, vec2.dist(position, shape.position))
  }

  const sorted = Object.values(shapes).sort(
    (a, b) => dists.get(a.id)! - dists.get(b.id)!,
  )

  const needsInput = new Set<ItemType>(
    Object.keys(recipe.input).map((key) =>
      ItemType.parse(key),
    ),
  )
  const needsOutput = new Set<ItemType>(
    Object.keys(recipe.output).map((key) =>
      ItemType.parse(key),
    ),
  )

  const input: Partial<
    Record<ItemType, Record<EntityId, true>>
  > = {}
  const output: Partial<
    Record<ItemType, Record<EntityId, true>>
  > = {}

  for (const inputType of needsInput) {
    input[inputType] = {}
    if (needsOutput.has(inputType)) {
      needsInput.delete(inputType)
    }
  }
  for (const outputType of needsOutput) {
    output[outputType] = {}
  }

  for (const peer of sorted) {
    if (needsInput.size === 0 && needsOutput.size === 0) {
      break
    }

    for (const inputType of needsInput) {
      if (peer.output[inputType]) {
        const entry = input[inputType]
        invariant(entry)
        entry[peer.id] = true
        needsInput.delete(inputType)
      }
    }

    for (const outputType of needsOutput) {
      if (peer.input[outputType]) {
        const entityIds = Object.keys(
          peer.input[outputType]!,
        ) as EntityId[]

        if (entityIds.length === 0) {
          const entry = output[outputType]
          invariant(entry)
          entry[peer.id] = true
        }
      }
    }
  }

  return {
    input,
    output,
  }
}
