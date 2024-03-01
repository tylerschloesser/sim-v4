import invariant from 'tiny-invariant'
import { Entity, EntityType } from './world.js'

export function isConnectValid(
  source: Entity,
  target: Entity | null,
): boolean {
  if (target === null) {
    return false
  }

  invariant(source.type === EntityType.enum.Miner)

  if (source.patchId !== null) {
    // this should only happen immediately after connecting,
    // but before we navigate back
    return false
  }

  if (target.type !== EntityType.enum.Patch) {
    return false
  }

  invariant(!target.minerIds[source.id])
  return true
}
