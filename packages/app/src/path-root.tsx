import { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
  inventoryHas,
} from './inventory.js'
import { entityRecipes } from './recipe.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import { RouteId, useRouteId } from './route.js'
import {
  Entity,
  EntityState,
  EntityType,
  Inventory,
} from './world.js'

export function PathRoot() {
  const { world, setWorld, buildValid } =
    useContext(AppContext)
  const routeId = useRouteId()

  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  const cursorInventory = getCursorInventory(
    world.cursor,
    world.inventories,
  )

  const hasMiner =
    routeId === RouteId.enum.BuildMiner
      ? inventoryHas(cursorInventory, minerRecipe.input)
      : null

  const navigate = useNavigate()
  useEffect(() => {
    if (routeId !== RouteId.enum.BuildMiner) {
      return
    }
    invariant(hasMiner !== null)
    if (routeId === RouteId.enum.BuildMiner && !hasMiner) {
      navigate('/')
    }
  }, [routeId, hasMiner])

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
      />
      <Outlet />
    </>
  )
}
