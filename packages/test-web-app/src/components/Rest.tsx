import React, { FC, useEffect } from 'react';
import { config } from '@/config'

export const Rest: FC = () => {
    const [username, setUsername] = React.useState<any>(null)
    useEffect(() => {
        fetch(new URL('/api/me', config.restUrl))
            .then(result => result.json())
            .then(result => setUsername(result.username))
    }, [])
    return (
        <div>Result for rest call: <span aria-label="username">{username ? username : 'none'}</span></div>
    )
}