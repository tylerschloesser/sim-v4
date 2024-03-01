import { times } from 'lodash-es'
import React, { useRef } from 'react'
import invariant from 'tiny-invariant'
import { mod } from './math.js'
import styles from './render-grid.module.scss'
import { useCameraEffect } from './use-camera-effect.js'
import {
  Viewport,
  getMinScale,
  getScale,
} from './viewport.js'

export interface RenderGridProps {
  viewport: Viewport
}

export const RenderGrid = React.memo(function RenderGrid({
  viewport,
}: RenderGridProps) {
  const root = useRef<SVGGElement>(null)

  const { x: vx, y: vy } = viewport.size
  const minScale = getMinScale(vx, vy)

  const rows = Math.ceil(vy / minScale / 2 + 2) * 2
  const cols = Math.ceil(vx / minScale / 2 + 2) * 2

  useCameraEffect((camera) => {
    invariant(root.current)

    const { x: vx, y: vy } = viewport.size
    const scale = getScale(camera.zoom, vx, vy)

    const { x: cx, y: cy } = camera.position
    const tx = mod(-cx * scale, scale * 2)
    const ty = mod(-cy * scale - vy * 0.1, scale * 2)

    const transform = [
      `translate(${tx.toFixed(4)} ${ty.toFixed(4)})`,
      `scale(${scale.toFixed(4)})`,
    ].join(' ')
    root.current.setAttribute('transform', transform)
  })

  return (
    <g data-group="grid" ref={root} className={styles.grid}>
      {times(rows + 1).map((row) => (
        <g key={row} data-row={row}>
          {times(cols + 1).map((col) => {
            if (row % 2 === col % 2) return null
            return (
              <rect
                className={styles.rect}
                key={col}
                x={-cols / 2 + col}
                y={-rows / 2 + row}
                width={1}
                height={1}
              />
            )
          })}
        </g>
      ))}
    </g>
  )
})
