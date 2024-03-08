import invariant from 'tiny-invariant'
import { ItemRecipe } from './recipe.js'
import { Vec2, vec2 } from './vec2.js'
import { EntityId, ItemType, World } from './world.js'

export function getInputOutput(
  entityId: EntityId | null,
  recipe: ItemRecipe,
  position: Vec2,
  shapes: World['shapes'],
  context: 'build' | 'edit',
): {
  input: Partial<Record<ItemType, Record<EntityId, true>>>
  output: Partial<Record<ItemType, Record<EntityId, true>>>
  effects: Record<
    EntityId,
    Partial<Record<ItemType, EntityId>>
  >
} {
  const dists = new Map<EntityId, number>()
  for (const shape of Object.values(shapes)) {
    dists.set(shape.id, vec2.dist(position, shape.position))
  }

  const sorted = Object.values(shapes).sort(
    (a, b) => dists.get(a.id)! - dists.get(b.id)!,
  )

  const needsInput = new Set<ItemType>(
    Object.keys(recipe.input).map((key) =>
      ItemType.parse(key),
    ),
  )
  const needsOutput = new Set<ItemType>(
    Object.keys(recipe.output).map((key) =>
      ItemType.parse(key),
    ),
  )

  // prettier-ignore
  const input: ReturnType<typeof getInputOutput>['input'] = {}
  // prettier-ignore
  const output: ReturnType<typeof getInputOutput>['output'] = {}
  // prettier-ignore
  const effects: ReturnType<typeof getInputOutput>['effects'] = {}

  for (const inputType of needsInput) {
    input[inputType] = {}
    if (needsOutput.has(inputType)) {
      needsInput.delete(inputType)
    }
  }

  for (const outputType of needsOutput) {
    output[outputType] = {}
  }

  for (const peer of sorted) {
    if (peer.id === entityId) {
      // during edit, ignore the entity we are moving
      continue
    }

    if (needsInput.size === 0 && needsOutput.size === 0) {
      break
    }

    for (const inputType of needsInput) {
      if (peer.output[inputType]) {
        const entry = input[inputType]
        invariant(entry)
        entry[peer.id] = true
        needsInput.delete(inputType)
      }
    }

    for (const outputType of needsOutput) {
      if (peer.input[outputType]) {
        const entityIds = Object.keys(
          peer.input[outputType]!,
        ) as EntityId[]

        invariant(entityIds.length <= 1)
        const peerPeerId = entityIds.at(0) ?? null

        const entry = output[outputType]
        invariant(entry)

        if (peerPeerId === null) {
          entry[peer.id] = true
        } else if (peerPeerId === entityId) {
          // in this case we are editing
          invariant(context === 'edit')

          const dist = dists.get(peer.id)
          invariant(typeof dist === 'number')

          const closerId = getCloserInputSource(
            peer.id,
            outputType,
            shapes,
            {
              entityId,
              dist,
            },
          )

          if (closerId) {
            let current = effects[peer.id]
            if (current) {
              invariant(!current[outputType])
            } else {
              current = {}
            }
            effects[peer.id] = {
              ...current,
              [outputType]: closerId,
            }
          } else {
            entry[peer.id] = true
          }
        } else {
          const peerPeer = shapes[peerPeerId]
          invariant(peerPeer)
          // TODO could cache this
          const dist = vec2.dist(
            peer.position,
            peerPeer.position,
          )
          if (dist > dists.get(peer.id)!) {
            // we are closer than the current input source
            entry[peer.id] = true
          }
        }
      }
    }
  }

  return {
    input,
    output,
    effects,
  }
}

function getCloserInputSource(
  entityId: EntityId,
  itemType: ItemType,
  shapes: World['shapes'],
  current: { entityId: EntityId; dist: number },
): EntityId | null {
  const entity = shapes[entityId]
  invariant(entity)

  let result = { ...current }

  for (const shape of Object.values(shapes)) {
    if (
      shape.id === current.entityId ||
      !shape.output[itemType]
    ) {
      continue
    }

    const dist = vec2.dist(entity.position, shape.position)
    if (dist < result.dist) {
      result = { entityId: shape.id, dist }
    }
  }

  if (result.entityId !== current.entityId) {
    return result.entityId
  }
  return null
}
