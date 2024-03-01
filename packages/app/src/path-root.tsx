import { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { getEntity } from './entity.js'
import {
  getEntityInventory,
  inventoryHas,
} from './inventory.js'
import { entityRecipes } from './recipe.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import {
  RouteId,
  useConnectEntityId,
  useRouteId,
} from './route.js'
import {
  EntityState,
  EntityType,
  Inventory,
} from './world.js'

export function PathRoot() {
  const { world, setWorld, buildValid, connectValid } =
    useContext(AppContext)
  const routeId = useRouteId()

  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  const { cursor } = world

  const hasMiner =
    routeId === RouteId.enum.BuildMiner
      ? inventoryHas(cursor.inventory, minerRecipe.input)
      : null

  const connectEntityId = useConnectEntityId()
  const connectEntity = connectEntityId
    ? world.entities[connectEntityId]
    : null
  const navigate = useNavigate()

  useEffect(() => {
    if (routeId !== RouteId.enum.BuildMiner) {
      return
    }
    invariant(hasMiner !== null)
    if (routeId === RouteId.enum.BuildMiner && !hasMiner) {
      navigate('..')
    }
  }, [routeId, hasMiner])

  useEffect(() => {
    if (routeId !== RouteId.enum.Connect) {
      return
    }
    invariant(connectEntity?.type === EntityType.enum.Miner)
    if (connectEntity.patchId) {
      navigate('..')
    }
  }, [routeId, connectEntity])

  let entity: Entity | null = null
  if (world.cursor.entityId) {
    entity = getEntity(
      world.entities,
      world.cursor.entityId,
    )
  }

  let entityInventory: Inventory | null = null
  let entityState: EntityState | null = null
  if (entity) {
    entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )
    entityState = world.states[entity.id] ?? null
    invariant(entityState?.type === entity.type)
  }

  return (
    <>
      <RenderViewport />
      <RenderInfo
        cursorInventory={cursorInventory}
        entity={entity}
        entityInventory={entityInventory}
        entityState={entityState}
      />
      <RenderControls
        cursorInventory={cursorInventory}
        setWorld={setWorld}
        entity={entity}
        entityInventory={entityInventory}
        buildValid={buildValid}
        connectValid={connectValid}
      />
      <Outlet />
    </>
  )
}
