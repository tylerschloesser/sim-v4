import invariant from 'tiny-invariant'
import { Cursor, Entity, World } from './world.js'

export function getCursorEntity(
  cursor: Cursor,
  entities: World['entities'],
): Entity | null {
  if (cursor.entityId === null) {
    return null
  }
  const entity = entities[cursor.entityId]
  invariant(entity)
  return entity
}
