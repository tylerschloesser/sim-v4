import { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { AppContext } from './app-context.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { RenderControls } from './render-controls.js'
import { RenderInfo } from './render-info.js'
import { RenderViewport } from './render-viewport.js'
import { Entity, EntityState, Inventory } from './world.js'

export function PathRoot() {
  const { world, setWorld, buildValid } =
    useContext(AppContext)

  const cursorInventory = getCursorInventory(
    world.cursor,
    world.inventories,
  )

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
