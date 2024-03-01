import invariant from 'tiny-invariant'
import {
  EntityType,
  MinerEntityShape,
  PatchEntityShape,
  World,
} from './world.js'

export function hasConnectedPatch(
  miner: MinerEntityShape,
  shapes: World['shapes'],
): boolean {
  return getConnectedPatchShape(miner, shapes) !== null
}

export function getConnectedPatchShape(
  miner: MinerEntityShape,
  shapes: World['shapes'],
): PatchEntityShape | null {
  for (const peerId of Object.keys(miner.connections)) {
    const peerShape = shapes[peerId]
    invariant(peerShape)
    if (peerShape.type === EntityType.enum.Patch) {
      return peerShape
    }
  }

  return null
}
