import invariant from 'tiny-invariant'
import { Inventory, ItemType, World } from './world.js'

export function getPatchItemType({
  items,
}: Inventory): ItemType {
  invariant(Object.keys(items).length === 1)
  const key = Object.keys(items).at(0)
  return ItemType.parse(key)
}

export function getCursorInventory(
  world: World,
): Inventory {
  const inventory =
    world.inventories[world.cursor.inventoryId]
  invariant(inventory)
  return inventory
}
