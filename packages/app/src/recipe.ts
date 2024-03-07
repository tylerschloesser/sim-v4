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

export const ItemRecipeKey = z.enum([
  ItemType.enum.Coal,
  ItemType.enum.IronOre,
  ItemType.enum.Stone,

  ItemType.enum.IronPlate,
])
export type ItemRecipeKey = z.infer<typeof ItemRecipeKey>

export interface ItemRecipe {
  itemRecipeKey: ItemRecipeKey
  entityType: EntityType
  input: Partial<Record<ItemType, number>>
  output: Partial<Record<ItemType, number>>
}

const TICKS_PER_SECOND = 10
function perSecond(s: number): number {
  return s / TICKS_PER_SECOND
}

export const itemRecipes: Record<
  ItemRecipeKey,
  ItemRecipe
> = {
  [ItemRecipeKey.enum.Coal]: {
    itemRecipeKey: ItemRecipeKey.enum.Coal,
    entityType: EntityType.enum.Miner,
    input: {
      [ItemType.enum.MineableCoal]: perSecond(1),
      [ItemType.enum.Coal]: perSecond(0.1),
    },
    output: {
      [ItemType.enum.Coal]: perSecond(1),
    },
  },
  [ItemRecipeKey.enum.IronOre]: {
    itemRecipeKey: ItemRecipeKey.enum.IronOre,
    entityType: EntityType.enum.Miner,
    input: {
      [ItemType.enum.MineableIronOre]: perSecond(1),
      [ItemType.enum.Coal]: perSecond(0.1),
    },
    output: {
      [ItemType.enum.IronOre]: perSecond(1),
    },
  },
  [ItemRecipeKey.enum.Stone]: {
    itemRecipeKey: ItemRecipeKey.enum.Stone,
    entityType: EntityType.enum.Miner,
    input: {
      [ItemType.enum.MineableStone]: perSecond(1),
      [ItemType.enum.Coal]: perSecond(0.1),
    },
    output: {
      [ItemType.enum.Stone]: perSecond(1),
    },
  },

  [ItemRecipeKey.enum.IronPlate]: {
    itemRecipeKey: ItemRecipeKey.enum.IronPlate,
    entityType: EntityType.enum.Smelter,
    input: {
      [ItemType.enum.IronOre]: perSecond(1),
      [ItemType.enum.Coal]: perSecond(0.1),
    },
    output: {
      [ItemType.enum.IronPlate]: perSecond(1),
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

export function getAvailableItemRecipes(
  inventory: Inventory,
): ItemRecipe[] {
  return Object.values(itemRecipes).filter((itemRecipe) => {
    const entityRecipe =
      entityRecipes[itemRecipe.entityType]
    invariant(entityRecipe)
    return inventoryHas(inventory, entityRecipe.input)
  })
}
