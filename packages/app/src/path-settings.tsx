import { useNavigate } from 'react-router-dom'
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
  return (
    <button
      onPointerUp={() => {
        navigate('..')
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
