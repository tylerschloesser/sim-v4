import * as z from 'zod'

export const Vec2 = z.strictObject({
  x: z.number(),
  y: z.number(),
})
export type Vec2 = z.infer<typeof Vec2>
