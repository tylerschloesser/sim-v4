import invariant from 'tiny-invariant'
import * as z from 'zod'
import { EntityType, Inventory, ItemType } from './world.js'

export const EntityRecipe = z.strictObject({
  id: z.string(),
  input: z.record(ItemType, z.number()),
  output: EntityType,
})
export type EntityRecipe = z.infer<typeof EntityRecipe>

const recipes: Record<string, EntityRecipe> = {}

function addEntityRecipe(
  type: EntityType,
  input: EntityRecipe['input'],
) {
  const id = type
  invariant(!recipes[id])
  recipes[id] = {
    id,
    input,
    output: type,
  }
}

addEntityRecipe(EntityType.enum.Smelter, {
  [ItemType.enum.Stone]: 20,
})

export function getAvailableRecipes(
  inventory: Inventory,
): EntityRecipe[] {
  const available = new Array<EntityRecipe>()
  for (const recipe of Object.values(recipes)) {
    let fulfilled = true
    for (const [key, value] of Object.entries(
      recipe.input,
    )) {
      const itemType = ItemType.parse(key)
      if ((inventory.items[itemType] ?? 0) < value) {
        fulfilled = false
        break
      }
    }
    if (fulfilled) {
      available.push(recipe)
    }
  }
  return available
}
