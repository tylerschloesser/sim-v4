import invariant from 'tiny-invariant'
import { Inventory, ItemType } from './world.js'

export function getPatchItemType({
  items,
}: Inventory): ItemType {
  invariant(Object.keys(items).length === 1)
  const key = Object.keys(items).at(0)
  return ItemType.parse(key)
}
