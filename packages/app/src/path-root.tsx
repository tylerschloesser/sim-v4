import { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { AppContext } from './app-context.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import { Entity, Inventory } from './world.js'

export function PathRoot() {
  const { world, setWorld } = useContext(AppContext)

  const cursorInventory = getCursorInventory(
    world.cursor,
    world.inventories,
  )

  let entity: Entity | undefined = undefined
  if (world.cursor.entityId) {
    entity = getEntity(
      world.entities,
      world.cursor.entityId,
    )
  }

  let entityInventory: Inventory | undefined = undefined
  if (entity) {
    entityInventory = getEntityInventory(
      entity,
      world.inventories,
    )
  }

  return (
    <>
      <RenderViewport />
      <RenderInfo
        cursor={world.cursor}
        entities={world.entities}
        inventories={world.inventories}
      />
      <RenderControls
        cursorInventory={cursorInventory}
        setWorld={setWorld}
        entity={entity}
        entityInventory={entityInventory}
      />
      <Outlet />
    </>
  )
}
