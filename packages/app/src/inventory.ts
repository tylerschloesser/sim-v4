import invariant from 'tiny-invariant'
import {
  Cursor,
  Entity,
  Inventory,
  ItemType,
  World,
} from './world.js'

export function getPatchItemType({
  items,
}: Inventory): ItemType {
  invariant(Object.keys(items).length === 1)
  const key = Object.keys(items).at(0)
  return ItemType.parse(key)
}

export function getCursorInventory(
  cursor: Cursor,
  inventories: World['inventories'],
): Inventory {
  const inventory = inventories[cursor.inventoryId]
  invariant(inventory)
  return inventory
}

export function getEntityInventory(
  entity: Entity,
  inventories: World['inventories'],
): Inventory {
  const inventory = inventories[entity.inventoryId]
  invariant(inventory)
  return inventory
}
