import { GeneratorEntityShape } from './world.js'

export function RenderGeneratorPowerArea({
  shape,
}: {
  shape: GeneratorEntityShape
}) {
  return (
    <circle
      cx={shape.position.x}
      cy={shape.position.y}
      r={10}
      fill={'hsla(60, 50%, 50%, .2)'}
    />
  )
}
