import invariant from 'tiny-invariant'
import { hasConnectedPatch } from './miner.js'
import { EntityShape, EntityType, World } from './world.js'

export function isConnectValid(
  source: EntityShape,
  target: EntityShape | null,
  shapes: World['shapes'],
): boolean {
  if (target === null) {
    return false
  }

  invariant(source.type === EntityType.enum.Miner)

  if (hasConnectedPatch(source, shapes)) {
    // this should only happen immediately after connecting,
    // but before we navigate back
    return false
  }

  if (target.type !== EntityType.enum.Patch) {
    return false
  }

  invariant(!target.connections[source.id])
  return true
}
