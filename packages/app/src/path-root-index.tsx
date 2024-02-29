import { useContext } from 'react'
import { AppContext } from './app-context.js'
import { getEntity } from './entity.js'
import {
  getCursorInventory,
  getEntityInventory,
} from './inventory.js'
import { RenderInfo } from './render-info.js'
import { RenderPrimaryButton } from './render-primary-button.js'
import { Entity, Inventory } from './world.js'

export function PathRootIndex() {
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
      <RenderInfo
        cursor={world.cursor}
        entities={world.entities}
        inventories={world.inventories}
      />
      <RenderPrimaryButton
        cursorInventory={cursorInventory}
        entities={world.entities}
        setWorld={setWorld}
        entity={entity}
        entityInventory={entityInventory}
      />
    </>
  )
}
