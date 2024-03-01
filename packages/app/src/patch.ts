import invariant from 'tiny-invariant'
import {
  EntityType,
  ItemType,
  MinerEntityShape,
  PatchEntity,
  World,
} from './world.js'

export function getPatchItemType(
  patch: PatchEntity,
): ItemType {
  const keys = Object.keys(patch.state.output)
  invariant(keys.length === 1)
  return ItemType.parse(keys.at(0))
}

export function getConnectedMinerShapes(
  patch: PatchEntity,
  shapes: World['shapes'],
): MinerEntityShape[] {
  return Object.values(shapes).filter(
    (shape): shape is MinerEntityShape => {
      if (shape.type !== EntityType.enum.Miner) {
        return false
      }
      if (shape.connections[patch.id]) {
        invariant(patch.shape.connections[shape.id])
        return true
      }
      return false
    },
  )
}
