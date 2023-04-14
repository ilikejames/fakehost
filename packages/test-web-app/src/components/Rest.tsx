import React, { FC, useEffect } from 'react';

export const Rest: FC = () => {
    const [username, setUsername] = React.useState<any>(null)
    useEffect(() => {
        fetch('http://example.com/api/me')
            .then(result => result.json())
            .then(result => setUsername(result.username))
    }, [])
    return (
        <div>Result for rest call: {username ? username : 'none'}</div>
    )
}