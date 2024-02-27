import { memoize } from 'lodash-es'

export const mlog = memoize(console.log).bind(console)
