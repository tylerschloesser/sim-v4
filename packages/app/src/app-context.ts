import { createContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Updater } from 'use-immer'
import { Camera } from './camera.js'
import { World } from './types.js'
import { Viewport } from './viewport.js'

export type ZoomLevel = 'high' | 'low'

export interface IAppContext {
  camera$: BehaviorSubject<Camera>
  viewport: Viewport
  world: World
  setWorld: Updater<World>
  zoomLevel: ZoomLevel
}

export const AppContext = createContext<IAppContext>(null!)
