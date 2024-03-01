import invariant from 'tiny-invariant'
import { World } from './world.js'

export function deleteEmptyPatch(
  world: World,
  patchId: string,
) {
  const shape = world.shapes[patchId]
  invariant(shape)

  const state = world.states[patchId]
  invariant(state)

  delete world.shapes[shape.id]
  delete world.states[state.id]

  for (const peerId of Object.keys(shape.connections)) {
    const peerShape = world.shapes[peerId]
    invariant(peerShape?.connections[patchId])
    delete peerShape.connections[patchId]
  }

  if (world.cursor.entityId === patchId) {
    world.cursor.entityId = null
  }
}
