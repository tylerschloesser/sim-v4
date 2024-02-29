import { Outlet } from 'react-router-dom'
import { RenderViewport } from './render-viewport.js'

export function PathRoot() {
  return (
    <>
      <RenderViewport />
      <Outlet />
    </>
  )
}
