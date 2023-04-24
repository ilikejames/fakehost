import React, { FC, useEffect } from 'react';
import { config } from '@/config'
import { UserControllerApi, Configuration } from '@fakehost/rest-generated-client-api'

export const Username: FC = () => {
    const [username, setUsername] = React.useState<string | null>(null)
    useEffect(() => {
        const api = new UserControllerApi(new Configuration({ basePath: config.restUrl }))
        api.me().then(result => setUsername(result.username))
    }, [])
    return (
        <div><code>GET /api/me: </code><span aria-label="username">{username ? username : 'loading...'}</span></div>
    )
}
