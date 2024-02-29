import { useMatches } from 'react-router-dom'
import invariant from 'tiny-invariant'
import * as z from 'zod'

export const RouteId = z.enum(['Root', 'BuildMiner'])
export type RouteId = z.infer<typeof RouteId>

export function useRouteId() {
  const matches = useMatches()
  invariant(matches.length === 2)
  const routeId = RouteId.parse(matches.at(1)?.id)
  return routeId
}
