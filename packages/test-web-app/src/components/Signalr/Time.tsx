import { FC } from 'react'
import { useTimeHub } from '@/api/time'

export const Time: FC = () => {
    const time = useTimeHub()

    return (
        <div>
            Time from the signalr service is <time>{time ? time.toLocaleTimeString() : 'loading...'}</time>
        </div>
    )
}
