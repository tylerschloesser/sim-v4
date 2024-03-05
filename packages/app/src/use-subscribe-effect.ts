import { useEffect } from 'react'
import { BehaviorSubject } from 'rxjs'

export function useSubscribeEffect<T>(
  subject: BehaviorSubject<T>,
  cb: (value: T) => void,
  deps?: React.DependencyList,
) {
  useEffect(() => {
    const sub = subject.subscribe((value) => cb(value))
    return () => {
      sub.unsubscribe()
    }
  }, [subject, ...(deps ?? [])])
}
