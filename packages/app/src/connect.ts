import invariant from 'tiny-invariant'
import { ItemRecipe } from './recipe.js'
import { Vec2, vec2 } from './vec2.js'
import { EntityId, ItemType, World } from './world.js'

export function getInputOutput(
  entityId: EntityId | null,
  recipe: ItemRecipe,
  position: Vec2,
  shapes: World['shapes'],
): {
  input: Partial<Record<ItemType, Record<EntityId, true>>>
  output: Partial<Record<ItemType, Record<EntityId, true>>>
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

  const input: Partial<
    Record<ItemType, Record<EntityId, true>>
  > = {}
  const output: Partial<
    Record<ItemType, Record<EntityId, true>>
  > = {}

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

        const entry = output[outputType]
        invariant(entry)
        if (entityIds.length === 0) {
          entry[peer.id] = true
        } else {
          const peerpeer = shapes[entityIds.at(0)!]
          invariant(peerpeer)
          // TODO could cache this
          const dist = vec2.dist(
            peer.position,
            peerpeer.position,
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
  }
}
