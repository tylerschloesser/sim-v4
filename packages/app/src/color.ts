import { memoize } from 'lodash-es'
import Prando from 'prando'

const rng = new Prando(1)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getColor = memoize((_id: string) => {
  const h = rng.nextInt(0, 360)
  return `hsl(${h}, 50%, 50%)`
})
