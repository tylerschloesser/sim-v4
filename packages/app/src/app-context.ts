import { createContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Camera } from './camera.js'

export interface IAppContext {
  camera$: BehaviorSubject<Camera>
}

export const AppContext = createContext<IAppContext>(null!)
