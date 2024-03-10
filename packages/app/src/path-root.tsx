import { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { AppContext } from './app-context.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderPanels } from './render-panels.js'
import { RenderViewport } from './render-viewport.js'
import { ViewContext } from './view-context.js'
import { useView } from './view.js'
import { getEntity } from './world.js'

export function PathRoot() {
  const { zoomLevel, camera$, world, setWorld } =
    useContext(AppContext)
  const view = useView()

  const { cursor } = world

  const cursorEntity = cursor.entityId
    ? getEntity(world, cursor.entityId)
    : null

  return (
    <ViewContext.Provider value={{ view }}>
      <RenderViewport />
      <RenderPanels
        zoomLevel={zoomLevel}
        cursor={cursor}
        world={world}
      />
      <RenderInfo
        task={world.task}
        cursor={cursor}
        cursorEntity={cursorEntity}
      />
      <RenderControls
        camera$={camera$}
        cursor={cursor}
        cursorEntity={cursorEntity}
        setWorld={setWorld}
      />
      <Outlet />
    </ViewContext.Provider>
  )
}
