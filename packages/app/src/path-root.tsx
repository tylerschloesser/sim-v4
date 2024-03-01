import { useContext, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { inventoryHas } from './inventory.js'
import { entityRecipes } from './recipe.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import {
  RouteId,
  useConnectEntityId,
  useRouteId,
} from './route.js'
import { EntityType, getEntity } from './world.js'

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
  const connectEntityShape = connectEntityId
    ? world.shapes[connectEntityId]
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
    invariant(
      connectEntityShape?.type === EntityType.enum.Miner,
    )
    if (connectEntityShape.patchId) {
      navigate('..')
    }
  }, [routeId, connectEntityShape])

  const cursorEntity = cursor.entityId
    ? getEntity(world, cursor.entityId)
    : null

  return (
    <>
      <RenderViewport />
      <RenderInfo
        cursor={cursor}
        cursorEntity={cursorEntity}
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
