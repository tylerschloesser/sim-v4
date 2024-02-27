import { useContext, useEffect } from 'react'
import { AppContext } from './app-context.js'
import { Camera } from './camera.js'
import { Viewport } from './viewport.js'

export function useCameraEffect(
  viewport: Viewport,
  cb: (camera: Camera, viewport: Viewport) => void,
) {
  const { camera$ } = useContext(AppContext)
  useEffect(() => {
    const sub = camera$.subscribe((camera) => {
      cb(camera, viewport)
    })
    return () => {
      sub.unsubscribe()
    }
  }, [viewport])
}
