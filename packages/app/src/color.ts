import { memoize } from 'lodash-es'
import Prando from 'prando'
import invariant from 'tiny-invariant'
import {
  Entity,
  EntityType,
  ItemType,
  PatchEntity,
} from './world.js'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getRandomColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})

interface Color {
  fill: string
  stroke?: string
}

export function getEntityColor(entity: Entity): Color {
  switch (entity.type) {
    case EntityType.enum.Patch:
      return getPatchColor(entity)
    case EntityType.enum.Smelter:
      return { fill: 'pink' }
    default:
      invariant(false)
  }
}

function getPatchColor(entity: PatchEntity) {
  let fill: string
  let stroke: string | undefined

  switch (entity.itemType) {
    case ItemType.enum.Coal:
      fill = 'black'
      stroke = 'gray'
      break
    case ItemType.enum.IronOre:
      fill = 'lightblue'
      stroke = 'gray'
      break
    case ItemType.enum.Stone:
      fill = 'darkgray'
      stroke = 'gray'
      break
    default:
      invariant(
        false,
        `TODO define color for ${entity.itemType}`,
      )
  }
  return { fill, stroke }
}
