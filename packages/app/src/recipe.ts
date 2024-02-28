import invariant from 'tiny-invariant'
import * as z from 'zod'
import { Inventory, ItemType } from './world.js'

export const Recipe = z.strictObject({
  id: z.string(),
  input: z.record(ItemType, z.number()),
  output: z.record(ItemType, z.number()),
})
export type Recipe = z.infer<typeof Recipe>

const recipes: Record<string, Recipe> = {}

function addRecipe(recipe: Recipe) {
  invariant(!recipes[recipe.id])
  recipes[recipe.id] = recipe
}

addRecipe({
  id: ItemType.enum.Smelter,
  input: {
    [ItemType.enum.Stone]: 20,
  },
  output: {
    [ItemType.enum.Smelter]: 1,
  },
})

export function getAvailableRecipes(
  inventory: Inventory,
): Recipe[] {
  const available = new Array<Recipe>()
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
