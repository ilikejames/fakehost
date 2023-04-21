import { FC, useEffect, useState } from 'react'
import { useTimeHub, TimeError } from '@/api/time'
import { config } from '@/config'

export const Signalr: FC = () => {

    const [status, setStatus] = useState<any>(null)
    const [headers, setHeaders] = useState<any>(null)

    useEffect(() => {
        fetch(config.signalrUrl, {
            method: 'OPTIONS'
        }).then(result => {
            setStatus(result.status)
            setHeaders(result.headers)
        })
    }, [])
    const time = useTimeHub()

    const renderTime = (time: null | TimeError | Date) => {
        if (!time) {
            return 'loading...'
        }
        if (time instanceof Date) {
            return time.toLocaleTimeString()
        }
        return 'error'
    }

    return (
        <div>
            <div>url: {config.signalrUrl}</div>
            <div>status: {status}</div>
            <div>headers: {JSON.stringify(headers)}</div>
            <div>Time from the signalr service is <time>{renderTime(time)}</time></div>
        </div>
    )
}
