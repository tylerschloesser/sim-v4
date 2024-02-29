import invariant from 'tiny-invariant'
import { Entity, World } from './world.js'

export function getEntity(
  entities: World['entities'],
  id: string,
): Entity {
  const entity = entities[id]
  invariant(entity)
  return entity
}
