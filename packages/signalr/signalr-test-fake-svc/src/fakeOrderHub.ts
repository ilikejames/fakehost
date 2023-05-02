import { FakeSignalrHub } from '@fakehost/signalr'
import { IOrderHub, OrderUpdate, observableToStreamResult } from '@fakehost/signalr-test-client-api'
import { from, map } from 'rxjs'
import { orderState } from './state'

const getAllOrders: IOrderHub['getAllOrders'] = () => {
    return observableToStreamResult(from(orderState.getAll()))
}

const orderStream: IOrderHub['orderStream'] = () => {
    return observableToStreamResult(
        orderState.stream$.pipe(
            map(([type, order]) => {
                const update: OrderUpdate = {
                    action: type,
                    order: order,
                }
                return update
            }),
        ),
    )
}

export const orderHub = new FakeSignalrHub<IOrderHub>('/orderhub', {}, 'capitalize')
orderHub.register('getAllOrders', getAllOrders)
orderHub.register('orderStream', orderStream)
