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
import { isConnectValid } from './connect.js'
import { inventoryHas } from './inventory.js'
import { entityRecipes } from './recipe.js'
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

const Connections = z.record(EntityId, z.literal(true))

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
  valid: z.boolean(),
  action: ConnectAction.nullable(),
  sourceId: EntityId,
})
export type ConnectView = z.infer<typeof ConnectView>

export const View = z.discriminatedUnion('type', [
  DefaultView,
  BuildView,
  ConnectView,
])
export type View = z.infer<typeof View>

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
        const connections = Connections.parse(
          JSON.parse(search.get('connections')!),
        )
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
        let valid: boolean = false
        if (cursor.entityId) {
          const target = shapes[cursor.entityId]
          invariant(target)
          valid = isConnectValid(source, target, shapes)
        }
        return {
          type: viewType,
          valid,
          sourceId,
          action: null,
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
          let valid: boolean = false
          if (cursor.entityId) {
            const target = shapes[cursor.entityId]
            invariant(target)
            valid = isConnectValid(source, target, shapes)
          }
          if (view.current.valid !== valid) {
            view.current = { ...view.current, valid }
            rerender()
          }
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
