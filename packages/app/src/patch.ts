import invariant from 'tiny-invariant'
import {
  EntityType,
  ItemType,
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

export function getConnectedMinerCount(
  patch: PatchEntity,
  shapes: World['shapes'],
): number {
  const output = patch.shape.output[patch.shape.itemType]
  invariant(output)
  for (const entityId of Object.keys(output)) {
    invariant(
      shapes[entityId]?.type === EntityType.enum.Miner,
    )
  }
  return Object.keys(output).length
}
