import { createContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Updater } from 'use-immer'
import { Camera } from './camera.js'
import { Viewport } from './viewport.js'
import { World } from './world.js'

export interface IAppContext {
  camera$: BehaviorSubject<Camera>
  viewport: Viewport
  world: World
  setWorld: Updater<World>

  buildValid: boolean | null
  setBuildValid(valid: boolean | null): void
}

export const AppContext = createContext<IAppContext>(null!)
