import { createContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Camera } from './camera.js'
import { Viewport } from './viewport.js'

export interface IAppContext {
  camera$: BehaviorSubject<Camera>
  viewport: Viewport
}

export const AppContext = createContext<IAppContext>(null!)
