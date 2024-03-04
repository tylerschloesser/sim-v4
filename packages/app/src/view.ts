import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  UIMatch,
  useMatches,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { AppContext } from './app-context.js'
import { isBuildValid } from './build.js'
import { getConnectAction } from './connect.js'
import { inventoryHas } from './inventory.js'
import { entityRecipes } from './recipe.js'
import {
  Connections,
  EntityId,
  EntityType,
} from './world.js'

export const ViewType = z.enum([
  'Default',
  'Build',
  'Connect',
  'Select',
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
  connections: Connections,
})
export type BuildView = z.infer<typeof BuildView>

export const ConnectAction = z.enum([
  'Connect',
  'Disconnect',
])
export type ConnectAction = z.infer<typeof ConnectAction>

export const ConnectView = z.strictObject({
  type: z.literal(ViewType.enum.Connect),
  action: ConnectAction.nullable(),
  sourceId: EntityId,
})
export type ConnectView = z.infer<typeof ConnectView>

export const SelectView = z.strictObject({
  type: z.literal(ViewType.enum.Select),
  selected: z.record(EntityId, z.literal(true)),
})
export type SelectView = z.infer<typeof SelectView>

export const View = z.discriminatedUnion('type', [
  DefaultView,
  BuildView,
  ConnectView,
  SelectView,
])
export type View = z.infer<typeof View>

function parseConnections(
  search: URLSearchParams,
): Connections {
  const json = search.get('connections')
  if (!json) return Connections.parse({})
  return Connections.parse(JSON.parse(json))
}

function useViewType(): ViewType {
  const matches = useMatches()
  invariant(matches.length === 2)

  const match = matches.at(1) as UIMatch<
    unknown,
    { viewType: ViewType }
  >

  return ViewType.parse(match.handle.viewType)
}

export function useView(): View {
  const { camera$, world } = useContext(AppContext)
  const { cursor, shapes } = world
  const viewType = useViewType()
  const [search] = useSearchParams()

  const [hack, setHack] = useState(0)
  const rerender = useCallback(
    () => setHack((prev) => prev + 1),
    [],
  )

  const view = useRef<View>()
  view.current = useMemo(() => {
    switch (viewType) {
      case ViewType.enum.Default: {
        return {
          type: viewType,
        }
      }
      case ViewType.enum.Build: {
        const entityType = EntityType.parse(
          search.get('entityType'),
        )
        const connections = parseConnections(search)
        const radius = 0.75
        const valid = isBuildValid(
          camera$.value.position,
          radius,
          shapes,
        )
        return {
          type: viewType,
          valid,
          entityType,
          connections,
        }
      }
      case ViewType.enum.Connect: {
        const sourceId = EntityId.parse(
          search.get('sourceId'),
        )
        const source = shapes[sourceId]
        invariant(source)
        let action: ConnectAction | null = null
        if (cursor.entityId) {
          const target = shapes[cursor.entityId]
          invariant(target)
          action = getConnectAction(source, target, shapes)
        }
        return {
          type: viewType,
          sourceId,
          action,
        }
      }
      case ViewType.enum.Select: {
        return {
          type: viewType,
          selected: {},
        }
      }
    }
  }, [viewType, search, cursor, camera$, shapes, hack])

  const navigate = useNavigate()
  useEffect(() => {
    switch (view.current?.type) {
      case ViewType.enum.Build: {
        const recipe =
          entityRecipes[view.current.entityType]
        invariant(recipe)
        if (!inventoryHas(cursor.inventory, recipe.input)) {
          navigate('..')
        }
      }
    }
  }, [view.current, cursor])

  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      switch (view.current?.type) {
        case ViewType.enum.Build: {
          const valid = isBuildValid(
            camera.position,
            0.75,
            shapes,
          )
          if (view.current.valid !== valid) {
            view.current = { ...view.current, valid }
            rerender()
          }
          break
        }
        case ViewType.enum.Connect: {
          const source = shapes[view.current.sourceId]
          invariant(source)
          let action: ConnectAction | null = null
          if (cursor.entityId) {
            const target = shapes[cursor.entityId]
            invariant(target)
            action = getConnectAction(
              source,
              target,
              shapes,
            )
          }
          if (view.current.action !== action) {
            view.current = { ...view.current, action }
            rerender()
          }
          break
        }
        case ViewType.enum.Select: {
          break
        }
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [view.current.type, camera$, shapes, cursor])

  return view.current
}
