import { FC, useId } from 'react'
import { Time } from './Time'
import { Orders } from './Orders'

export const Signalr: FC = () => {
    const titleId = useId()

    return (
        <section aria-labelledby={titleId}>
            <h2 id={titleId}>Signalr</h2>
            <Time />
            <Orders />
        </section>
    )
}
