import invariant from 'tiny-invariant'
import { hasConnectedPatch } from './miner.js'
import { ConnectAction } from './view.js'
import { EntityShape, EntityType, World } from './world.js'

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
