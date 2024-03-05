import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import styles from './path-settings.module.scss'

export function PathSettings() {
  return (
    <div data-pointer="capture" className={styles.settings}>
      <BackButton />
      <ResetButton />
    </div>
  )
}

function BackButton() {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  return (
    <button
      onPointerUp={() => {
        navigate(`..?${search.toString()}`)
      }}
    >
      Back
    </button>
  )
}

function ResetButton() {
  return (
    <button
      onPointerUp={() => {
        if (window.confirm('Reset?')) {
          localStorage.setItem('reset', 'true')
          self.location.reload()
        }
      }}
    >
      Reset
    </button>
  )
}
