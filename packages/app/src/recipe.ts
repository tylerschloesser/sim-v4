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

export const entityRecipes: Record<string, EntityRecipe> = {
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
  [EntityType.enum.Generator]: {
    input: {
      [ItemType.enum.Stone]: 20,
      [ItemType.enum.IronPlate]: 40,
    },
    output: EntityType.enum.Generator,
  },
  [EntityType.enum.Crafter]: {
    input: {
      [ItemType.enum.IronPlate]: 60,
    },
    output: EntityType.enum.Crafter,
  },
}

interface ItemRecipe {
  itemType: ItemType
  entityType: EntityType
  input: Partial<Record<ItemType, number>>
  output: Partial<Record<ItemType, number>>
}

export const itemRecipes: Partial<
  Record<ItemType, ItemRecipe>
> = {
  [ItemType.enum.Coal]: {
    itemType: ItemType.enum.Coal,
    entityType: EntityType.enum.Miner,
    input: {
      [ItemType.enum.MineableCoal]: 1,
    },
    output: {
      [ItemType.enum.Coal]: 1,
    },
  },
}

export const smelterRecipes: Record<string, SmelterRecipe> =
  {
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
