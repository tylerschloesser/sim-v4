import { memoize } from 'lodash-es'
import Prando from 'prando'
import { ItemType } from './world.js'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getRandomColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})

export function getPatchColor(type: ItemType): {
  fill: string
  stroke?: string
} {
  let fill: string
  let stroke: string | undefined
  switch (type) {
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
  }
  return { fill, stroke }
}
