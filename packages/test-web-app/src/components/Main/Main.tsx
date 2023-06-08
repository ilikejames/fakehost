import React, { FC } from 'react'
import { Rest } from '@/components/Rest'
import { Signalr } from '@/components/Signalr'

export const Main: FC = React.memo(() => {
    return (
        <main>
            <Rest />
            <Signalr />
        </main>
    )
})


