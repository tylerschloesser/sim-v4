import * as z from 'zod'
import { EntityId, EntityType } from './world.js'

export const ViewType = z.enum([
  'Default',
  'Build',
  'Connect',
])
export type ViewType = z.infer<typeof ViewType>

export const DefaultView = z.strictObject({
  type: z.literal(ViewType.enum.Default),
})
export type DefaultView = z.infer<typeof DefaultView>

export const BuildView = z.strictObject({
  type: z.literal(ViewType.enum.Build),
  valid: z.boolean(),
  entityType: EntityType,
  connections: z.record(EntityId, z.literal(true)),
})
export type BuildView = z.infer<typeof BuildView>

export const ConnectView = z.strictObject({
  type: z.literal(ViewType.enum.Connect),
  valid: z.boolean(),
  sourceId: EntityId,
})
export type ConnectView = z.infer<typeof ConnectView>

export const View = z.discriminatedUnion('type', [
  DefaultView,
  BuildView,
  ConnectView,
])
export type View = z.infer<typeof View>
