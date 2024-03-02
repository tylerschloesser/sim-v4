import {
  useMatches,
  useSearchParams,
} from 'react-router-dom'
import invariant from 'tiny-invariant'
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

export const RouteId = z.enum([
  'Root',
  'BuildMiner',
  'Connect',
])
export type RouteId = z.infer<typeof RouteId>

export function useRouteId() {
  const matches = useMatches()
  invariant(matches.length === 2)
  const routeId = RouteId.parse(matches.at(1)?.id)
  return routeId
}

export function usePatchId(): string | null {
  const [params] = useSearchParams()
  return params.get('patchId')
}

export function useConnectEntityId(): string | null {
  const [params] = useSearchParams()
  return params.get('entityId')
}
