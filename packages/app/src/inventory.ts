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

export function inventoryHas(
  inventory: Inventory,
  items: Partial<Record<ItemType, number>>,
): boolean {
  for (const [key, count] of Object.entries(items)) {
    const itemType = ItemType.parse(key)
    if ((inventory.items[itemType] ?? 0) < count) {
      return false
    }
  }
  return true
}

export function inventorySub(
  inventory: Inventory,
  items: Partial<Record<ItemType, number>>,
): void {
  for (const [key, count] of Object.entries(items)) {
    const itemType = ItemType.parse(key)

    let inventoryCount = inventory.items[itemType] ?? 0
    invariant(inventoryCount >= count)

    inventoryCount -= count

    if (inventoryCount === 0) {
      delete inventory.items[itemType]
    } else {
      inventory.items[itemType] = inventoryCount
    }
  }
}
