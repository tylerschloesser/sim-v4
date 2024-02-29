import { Outlet, useMatches } from 'react-router-dom'

export function PathRoot() {
  const matches = useMatches()
  console.log(matches)

  return <Outlet />
}
