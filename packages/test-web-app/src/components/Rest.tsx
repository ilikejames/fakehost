import React, { FC, useEffect } from 'react';
import { config } from '@/config'
import { UserControllerApi, Configuration } from '@fakehost/rest-generated-client-api'

export const Rest: FC = () => {
    const [username, setUsername] = React.useState<any>(null)
    useEffect(() => {
        const api = new UserControllerApi(new Configuration({ basePath: config.restUrl }))
        api.me().then(result => setUsername(result.username))
    }, [])
    return (
        <div>Result for rest call: <span aria-label="username">{username ? username : 'none'}</span></div>
    )
}
