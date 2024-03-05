import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import { ItemRecipeKey, itemRecipes } from './recipe.js'
import {
  EntityType,
  ItemType,
  World,
  getEntity,
} from './world.js'

export function tickWorld(setWorld: Updater<World>): void {
  setWorld((world) => {
    world.tick += 1

    // inputs
    for (const entityId of Object.keys(world.shapes)) {
      const entity = getEntity(world, entityId)
      if (entity.type === EntityType.enum.Patch) {
        continue
      }

      const itemRecipeKey = ItemRecipeKey.parse(
        entity.shape.itemType,
      )
      const recipe = itemRecipes[itemRecipeKey]

      let satisfaction = 1

      for (const [key, perTick] of Object.entries(
        recipe.input,
      )) {
        const itemType = ItemType.parse(key)
        satisfaction = Math.min(
          satisfaction,
          (entity.state.input[itemType] ?? 0) / perTick,
        )
      }

      invariant(satisfaction >= 0)
      invariant(satisfaction <= 1)

      if (satisfaction === 0) {
        continue
      }

      for (const [key, perTick] of Object.entries(
        recipe.input,
      )) {
        const itemType = ItemType.parse(key)
        const value = entity.state.input[itemType]
        invariant(typeof value === 'number')
        entity.state.input[itemType] =
          value - perTick * satisfaction
      }

      for (const [key, perTick] of Object.entries(
        recipe.output,
      )) {
        const itemType = ItemType.parse(key)
        entity.state.output[itemType] =
          (entity.state.output[itemType] ?? 0) +
          perTick * satisfaction
      }
    }

    // outputs
    for (const entityId of Object.keys(world.shapes)) {
      const entity = getEntity(world, entityId)

      for (const [key, value] of Object.entries(
        entity.shape.output,
      )) {
        const outputType = ItemType.parse(key)

        for (const outputEntityId of Object.keys(value)) {
          const outputEntity = getEntity(
            world,
            outputEntityId,
          )
          const itemRecipeKey = ItemRecipeKey.parse(
            outputEntity.shape.itemType,
          )

          const recipe = itemRecipes[itemRecipeKey]
          invariant(recipe)

          const recipeInput = recipe.input[outputType]
          invariant(typeof recipeInput === 'number')

          const needed = Math.max(
            recipeInput -
              (outputEntity.state.input[outputType] ?? 0),
            0,
          )

          const available =
            entity.state.output[outputType] ?? 0

          if (needed === 0 || available === 0) {
            continue
          }

          const count = Math.min(needed, available)

          entity.state.output[outputType] =
            available - count

          outputEntity.state.input[outputType] =
            (outputEntity.state.input[outputType] ?? 0) +
            count
        }
      }
    }
  })
}
