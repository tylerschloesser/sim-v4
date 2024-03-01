import invariant from 'tiny-invariant'
import { inventoryHas } from './inventory.js'
import { EntityType, World } from './world.js'

export function deleteEmptyPatch(
  world: World,
  patchId: string,
) {
  const patch = world.entities[patchId]
  invariant(patch?.type === EntityType.enum.Patch)

  const inventory = world.inventories[patch.inventoryId]
  invariant(inventory)

  const { itemType } = patch

  invariant(!inventoryHas(inventory, { [itemType]: 1 }))

  delete world.entities[patch.id]
  delete world.inventories[patch.inventoryId]

  for (const minerId of Object.keys(patch.minerIds)) {
    const miner = world.entities[minerId]
    invariant(miner?.type === EntityType.enum.Miner)
    miner.patchId = null
  }

  if (world.cursor.entityId === patch.id) {
    world.cursor.entityId = null
  }
}
