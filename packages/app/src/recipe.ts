import * as z from 'zod'
import { ItemType } from './world.js'

export const Recipe = z.strictObject({
  input: z.record(ItemType, z.number()),
  output: z.record(ItemType, z.number()),
})
export type Recipe = z.infer<typeof Recipe>

export const recipes = [
  {
    input: {
      [ItemType.enum.Stone]: 20,
    },
    output: {
      [ItemType.enum.Smelter]: 1,
    },
  },
]
