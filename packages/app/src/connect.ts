import invariant from 'tiny-invariant'
import { hasConnectedPatch } from './miner.js'
import { Vec2, vec2 } from './vec2.js'
import { ConnectAction } from './view.js'
import {
  ConnectionType,
  Connections,
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

export function getBuildGeneratorConnections(
  position: Vec2,
  shapes: World['shapes'],
): Connections {
  const connections: Connections = {}

  for (const shape of Object.values(shapes)) {
    if (shape.type !== EntityType.enum.Crafter) {
      continue
    }
    const v = vec2.clone(shape.position)
    vec2.sub(v, position)
    if (vec2.len(v) <= 10) {
      connections[shape.id] = ConnectionType.enum.Power
    }
  }

  return connections
}

export function getInputOutput(
  entityType: EntityType,
  position: Vec2,
  shapes: World['shapes'],
): {
  input: Partial<Record<ItemType, EntityId>>
  output: Partial<Record<ItemType, EntityId>>
} {
  const dists = new Map<EntityId, number>()
  for (const shape of Object.values(shapes)) {
    dists.set(shape.id, vec2.dist(position, shape.position))
  }

  const sorted = Object.values(shapes).sort(
    (a, b) => dists.get(a.id)! - dists.get(b.id)!,
  )

  const input: Partial<Record<ItemType, EntityId>> = {}

  const closest = sorted.at(0)
  if (closest) {
    input[ItemType.enum.IronOre] = closest.id
  }

  return {
    input,
    output: {},
  }
}
