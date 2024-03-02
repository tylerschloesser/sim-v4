import { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { entityRecipes } from './recipe.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import { ViewContext } from './view-context.js'
import { useView } from './view.js'
import { EntityType, getEntity } from './world.js'

export function PathRoot() {
  const { world, setWorld } = useContext(AppContext)
  const view = useView()

  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  const { cursor } = world

  const cursorEntity = cursor.entityId
    ? getEntity(world, cursor.entityId)
    : null

  return (
    <ViewContext.Provider value={{ view }}>
      <RenderViewport />
      <RenderInfo
        cursor={cursor}
        cursorEntity={cursorEntity}
        shapes={world.shapes}
      />
      <RenderControls
        cursor={cursor}
        cursorEntity={cursorEntity}
        setWorld={setWorld}
      />
      <Outlet />
    </ViewContext.Provider>
  )
}
