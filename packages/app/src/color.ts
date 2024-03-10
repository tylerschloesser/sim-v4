import { memoize } from 'lodash-es'
import Prando from 'prando'
import invariant from 'tiny-invariant'
import { getPatchItemType } from './patch.js'
import {
  Entity,
  EntityType,
  ItemType,
  PatchEntity,
} from './types.js'

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
    case EntityType.enum.Miner:
      return { fill: 'orange' }
    case EntityType.enum.Generator:
      return { fill: 'hsl(60, 50%, 50%)' }
    case EntityType.enum.Crafter:
      return { fill: 'hsl(300, 50%, 50%)' }
    default:
      invariant(false)
  }
}

function getPatchColor(entity: PatchEntity) {
  let fill: string
  let stroke: string | undefined

  const itemType = getPatchItemType(entity)
  switch (itemType) {
    case ItemType.enum.MineableCoal:
    case ItemType.enum.Coal:
      fill = 'black'
      stroke = 'gray'
      break
    case ItemType.enum.MineableIronOre:
    case ItemType.enum.IronOre:
      fill = 'lightblue'
      stroke = 'gray'
      break
    case ItemType.enum.MineableStone:
    case ItemType.enum.Stone:
      fill = 'darkgray'
      stroke = 'gray'
      break
    default:
      invariant(false, `TODO define color for ${itemType}`)
  }
  return { fill, stroke }
}
