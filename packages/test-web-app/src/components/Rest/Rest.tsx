import { Button } from '@mui/material'
import { FC, useId, useState } from 'react';
import { OrderForm } from './OrderForm'
import { Username } from './Username'

type Dialogs = {
    orderForm?: boolean
}

export const Rest: FC = () => {
    const titleId = useId()
    const [dialogs, setDialogs] = useState<Dialogs>({})

    return (
        <section aria-labelledby={titleId}>
            <h2 id={titleId}>Rest</h2>
            <Username />
            <Button variant="contained" onClick={() => setDialogs({ orderForm: true })}>POST Data</Button>
            {dialogs.orderForm && <OrderForm onClose={() => setDialogs({})} />}
        </section>
    )
}
