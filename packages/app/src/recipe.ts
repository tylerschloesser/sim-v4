import invariant from 'tiny-invariant'
import * as z from 'zod'
import { EntityType, Inventory, ItemType } from './world.js'

export const EntityRecipe = z.strictObject({
  id: z.string(),
  input: z.record(ItemType, z.number()),
  output: EntityType,
})
export type EntityRecipe = z.infer<typeof EntityRecipe>

export const SmelterRecipe = z.strictObject({
  id: z.string(),
  input: z.record(ItemType, z.number()),
  output: ItemType,
})
export type SmelterRecipe = z.infer<typeof SmelterRecipe>

export const entityRecipes: Record<string, EntityRecipe> =
  {}
export const smelterRecipes: Record<string, SmelterRecipe> =
  {}

function addEntityRecipe(
  type: EntityType,
  input: EntityRecipe['input'],
) {
  const id = type
  invariant(!entityRecipes[id])
  entityRecipes[id] = {
    id,
    input,
    output: type,
  }
}

addEntityRecipe(EntityType.enum.Smelter, {
  [ItemType.enum.Stone]: 20,
})

function addSmelterRecipe(
  type: ItemType,
  input: SmelterRecipe['input'],
) {
  const id = type
  invariant(!smelterRecipes[id])
  smelterRecipes[id] = {
    id,
    input,
    output: type,
  }
}

addSmelterRecipe(ItemType.enum.IronPlate, {
  [ItemType.enum.IronOre]: 1,
})

export function getAvailableEntityRecipes(
  inventory: Inventory,
): EntityRecipe[] {
  const available = new Array<EntityRecipe>()
  for (const recipe of Object.values(entityRecipes)) {
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
