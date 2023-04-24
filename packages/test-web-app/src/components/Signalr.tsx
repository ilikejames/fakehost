import React, { FC, useId } from 'react'
import { useTimeHub } from '@/api/time'

export const Signalr: FC = () => {
    const titleId = useId()
    const time = useTimeHub()

    return (
        <section aria-labelledby={titleId}>
            <h2 id={titleId}>Signalr</h2>
            <div>
                Time from the signalr service is <time>{time ? time.toLocaleTimeString() : 'loading...'}</time>
            </div>
        </section>
    )
}
