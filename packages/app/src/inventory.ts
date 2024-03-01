import invariant from 'tiny-invariant'
import { Inventory, ItemType } from './world.js'

export function inventoryHas(
  inventory: Inventory,
  items: Inventory,
): boolean {
  for (const [key, count] of Object.entries(items)) {
    const itemType = ItemType.parse(key)
    if ((inventory[itemType] ?? 0) < count) {
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

    let inventoryCount = inventory[itemType] ?? 0
    invariant(inventoryCount >= count)

    inventoryCount -= count

    if (inventoryCount === 0) {
      delete inventory[itemType]
    } else {
      inventory[itemType] = inventoryCount
    }
  }
}

export function inventoryAdd(
  inventory: Inventory,
  items: Partial<Record<ItemType, number>>,
): void {
  for (const [key, count] of Object.entries(items)) {
    const itemType = ItemType.parse(key)

    let inventoryCount = inventory[itemType] ?? 0
    inventoryCount += count

    inventory[itemType] = inventoryCount
  }
}

export function inventoryMove(
  source: Inventory,
  target: Inventory,
  items?: Partial<Record<ItemType, number>>,
): void {
  if (!items) {
    items = source
  }

  for (const [key, count] of Object.entries(items)) {
    invariant(count > 0)
    const itemType = ItemType.parse(key)

    let sourceCount = source[itemType] ?? 0
    invariant(sourceCount >= count)
    sourceCount -= count
    if (sourceCount > 0) {
      source[itemType] = sourceCount
    } else {
      delete source[itemType]
    }

    let targetCount = target[itemType] ?? 0
    targetCount += count
    target[itemType] = targetCount
  }
}
