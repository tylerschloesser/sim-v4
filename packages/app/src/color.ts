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
} {
  let fill: string
  switch (type) {
    case ItemType.enum.Coal:
      fill = 'black'
      break
    case ItemType.enum.IronOre:
      fill = 'lightblue'
      break
    case ItemType.enum.Stone:
      fill = 'gray'
      break
  }
  return { fill }
}
