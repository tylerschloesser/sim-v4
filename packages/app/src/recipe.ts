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
  return []
}
