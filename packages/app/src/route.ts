import * as z from 'zod'

export const RouteId = z.enum(['Root', 'BuildMiner'])
export type RouteId = z.infer<typeof RouteId>
