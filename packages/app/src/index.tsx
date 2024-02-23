import { createRoot } from 'react-dom/client'
import invariant from 'tiny-invariant'

const container = document.getElementById('root')
invariant(container)

createRoot(container).render(<>TODO</>)
