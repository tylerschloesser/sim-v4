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
  invariant(source.patchId === null)

  if (target.type !== EntityType.enum.Patch) {
    return false
  }

  invariant(!target.minerIds[source.id])
  return true
}
