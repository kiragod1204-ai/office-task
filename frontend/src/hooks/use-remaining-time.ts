import { useState, useEffect } from 'react'
import { getRemainingTime } from '@/lib/utils'

export const useRemainingTime = (deadline: string | Date, status?: string) => {
  const [remainingTime, setRemainingTime] = useState(() => getRemainingTime(deadline))

  useEffect(() => {
    // Don't update for completed tasks
    if (status === 'Hoàn thành') {
      return
    }

    const updateRemainingTime = () => {
      setRemainingTime(getRemainingTime(deadline))
    }

    // Update immediately
    updateRemainingTime()

    // Set up interval to update every minute
    const interval = setInterval(updateRemainingTime, 60000)

    return () => clearInterval(interval)
  }, [deadline, status])

  return remainingTime
}