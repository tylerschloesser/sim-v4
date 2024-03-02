import React from 'react'
import { View } from './view.js'

export interface IViewContext {
  view: View
}

export const ViewContext =
  React.createContext<IViewContext>(null!)
