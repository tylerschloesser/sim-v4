import invariant from 'tiny-invariant'
import * as z from 'zod'
import { inventoryHas } from './inventory.js'
import { EntityType, Inventory, ItemType } from './world.js'

export const EntityRecipe = z.strictObject({
  input: z.record(ItemType, z.number()),
  output: EntityType,
})
export type EntityRecipe = z.infer<typeof EntityRecipe>

export const SmelterRecipe = z.strictObject({
  input: z.record(ItemType, z.number()),
  output: z.record(ItemType, z.number()),
})
export type SmelterRecipe = z.infer<typeof SmelterRecipe>

export const entityRecipes: Partial<
  Record<EntityType, EntityRecipe>
> = {
  [EntityType.enum.Smelter]: {
    input: {
      [ItemType.enum.Stone]: 20,
    },
    output: EntityType.enum.Smelter,
  },
  [EntityType.enum.Miner]: {
    input: {
      [ItemType.enum.Stone]: 20,
      [ItemType.enum.IronPlate]: 20,
    },
    output: EntityType.enum.Miner,
  },
}

export const smelterRecipes: Partial<
  Record<ItemType, SmelterRecipe>
> = {
  [ItemType.enum.IronPlate]: {
    input: {
      [ItemType.enum.IronOre]: 1,
    },
    output: {
      [ItemType.enum.IronPlate]: 1,
    },
  },
}

export function getAvailableEntityRecipes(
  inventory: Inventory,
): EntityRecipe[] {
  return Object.values(entityRecipes).filter((recipe) =>
    inventoryHas(inventory, recipe.input),
  )
}
