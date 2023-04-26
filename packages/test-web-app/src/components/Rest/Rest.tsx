import { FC, useId } from 'react';
import { Username } from './Username'

export const Rest: FC = () => {
    const titleId = useId()

    return (
        <section aria-labelledby={titleId}>
            <h2 id={titleId}>Rest</h2>
            <Username />
        </section>
    )
}
