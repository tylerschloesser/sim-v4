import { isEqual } from 'lodash-es'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import invariant from 'tiny-invariant'
import * as z from 'zod'
import { AppContext } from './app-context.js'
import { isBuildValid } from './build.js'
import { Camera } from './camera.js'
import {
  getConnectAction,
  getInputOutput,
} from './connect.js'
import { inventoryHas } from './inventory.js'
import {
  ItemRecipeKey,
  entityRecipes,
  itemRecipes,
} from './recipe.js'
import { useSubscribeEffect } from './use-subscribe-effect.js'
import {
  EntityId,
  EntityType,
  ItemType,
  World,
} from './world.js'

export const ViewType = z.enum([
  'Default',
  'Build',
  'Connect',
  'Select',
])
export type ViewType = z.infer<typeof ViewType>

//
// Default
//
export const DefaultViewSearchParam = z.strictObject({
  type: z.literal(ViewType.enum.Default),
})
export type DefaultViewSearchParam = z.infer<
  typeof DefaultViewSearchParam
>
export const DefaultView = DefaultViewSearchParam
export type DefaultView = z.infer<typeof DefaultView>

//
// Build
//
export const BuildViewSearchParam = z.strictObject({
  type: z.literal(ViewType.enum.Build),
  itemRecipeKey: ItemRecipeKey,
})
export type BuildViewSearchParam = z.infer<
  typeof BuildViewSearchParam
>
export const BuildView = BuildViewSearchParam.extend({
  valid: z.boolean(),
  entityType: EntityType,
  input: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
  output: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
})
export type BuildView = z.infer<typeof BuildView>

//
// Connect
//
export const ConnectAction = z.enum([
  'Connect',
  'Disconnect',
])
export type ConnectAction = z.infer<typeof ConnectAction>
export const ConnectViewSearchParam = z.strictObject({
  type: z.literal(ViewType.enum.Connect),
  sourceId: EntityId,
})
export type ConnectViewSearchParam = z.infer<
  typeof ConnectViewSearchParam
>
export const ConnectView = ConnectViewSearchParam.extend({
  action: ConnectAction.nullable(),
})
export type ConnectView = z.infer<typeof ConnectView>

//
// Select
//
export const SelectViewSearchParam = z.strictObject({
  type: z.literal(ViewType.enum.Select),
  selected: z.record(EntityId, z.literal(true)),
})
export type SelectViewSearchParam = z.infer<
  typeof SelectViewSearchParam
>
export const SelectView = SelectViewSearchParam
export type SelectView = z.infer<typeof SelectView>

const ViewSearchParam = z.discriminatedUnion('type', [
  DefaultViewSearchParam,
  BuildViewSearchParam,
  ConnectViewSearchParam,
  SelectViewSearchParam,
])
type ViewSearchParam = z.infer<typeof ViewSearchParam>

export const View = z.discriminatedUnion('type', [
  DefaultView,
  BuildView,
  ConnectView,
  SelectView,
])
export type View = z.infer<typeof View>

const DEFAULT_VIEW_SEARCH_PARAM: DefaultViewSearchParam = {
  type: ViewType.enum.Default,
}

function useViewSearchParam(): ViewSearchParam {
  const [search] = useSearchParams()
  return useMemo(() => {
    const json = search.get('view')
    if (json === null) {
      return DEFAULT_VIEW_SEARCH_PARAM
    }
    return ViewSearchParam.parse(JSON.parse(json))
  }, [search])
}

export function useSetViewSearchParam(): (
  param: ViewSearchParam | null,
) => void {
  const setSearch = useSearchParams()[1]
  return useCallback(
    (param: ViewSearchParam | null) => {
      ViewSearchParam.nullable().parse(param)
      setSearch((prev) => {
        if (param === null) {
          prev.delete('view')
        } else {
          prev.set('view', JSON.stringify(param))
        }
        return prev
      })
    },
    [setSearch],
  )
}

function getView(
  param: ViewSearchParam,
  camera: Camera,
  world: World,
): View {
  switch (param.type) {
    case ViewType.enum.Default: {
      return param
    }
    case ViewType.enum.Build: {
      const radius = 0.75
      const valid = isBuildValid(
        camera.position,
        radius,
        world.shapes,
      )

      const recipe = itemRecipes[param.itemRecipeKey]

      const { input, output } = getInputOutput(
        recipe,
        camera.position,
        world.shapes,
      )

      return {
        ...param,
        valid,
        input,
        output,
        entityType: recipe.entityType,
      }
    }
    case ViewType.enum.Connect: {
      const source = world.shapes[param.sourceId]
      invariant(source)
      let action: ConnectAction | null = null
      if (world.cursor.entityId) {
        const target = world.shapes[world.cursor.entityId]
        invariant(target)
        action = getConnectAction(
          source,
          target,
          world.shapes,
        )
      }
      return { ...param, action }
    }
    case ViewType.enum.Select: {
      return param
    }
  }
}

export function useView(): View {
  const { camera$, world } = useContext(AppContext)
  const { cursor } = world

  const param = useViewSearchParam()

  const initialView = useMemo(
    () => getView(param, camera$.value, world),
    [],
  )

  const [view, setView] = useState(initialView)

  useSubscribeEffect(
    camera$,
    (camera) => {
      setView((prev) => {
        const next = getView(param, camera, world)
        return isEqual(next, prev) ? prev : next
      })
    },
    [param, world],
  )

  const navigate = useNavigate()
  useEffect(() => {
    switch (view.type) {
      case ViewType.enum.Build: {
        const itemRecipe = itemRecipes[view.itemRecipeKey]
        invariant(itemRecipe)
        const entityRecipe =
          entityRecipes[itemRecipe.entityType]
        invariant(entityRecipe)
        if (
          !inventoryHas(
            cursor.inventory,
            entityRecipe.input,
          )
        ) {
          navigate('..')
        }
      }
    }
  }, [view, cursor])

  return view
}
