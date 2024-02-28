import { memoize } from 'lodash-es'
import Prando from 'prando'
import { ItemType } from './world.js'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getRandomColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})

export function getPatchColor(type: ItemType): string {
  switch (type) {
    case ItemType.enum.Coal:
      return 'black'
    case ItemType.enum.IronOre:
      return 'lightblue'
    case ItemType.enum.Stone:
      return 'gray'
  }
}
