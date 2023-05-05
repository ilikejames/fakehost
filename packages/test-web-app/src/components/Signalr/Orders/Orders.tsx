import { FC, useId } from 'react'
import { OrderGrid } from './OrderGrid'

export const Orders: FC = () => {
    const titleId = useId()
    return (
        <div>
            <h2 id={titleId}>Orders</h2>
            <OrderGrid />
        </div>
    )
}