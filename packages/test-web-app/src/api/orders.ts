import {
    HubConnectionBuilder,
    Order,
    OrderUpdate,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { from, map, merge, scan, shareReplay, switchMap, throttleTime } from 'rxjs'
import { config } from '@/config'

const connection = new HubConnectionBuilder()
    .withUrl(new URL('/orderhub', config.signalrUrl).toString())
    .build()

const service = () => getHubProxyFactory('IOrderHub').createHubProxy(connection)

const connection$ = from(connection.start()).pipe(shareReplay(1))

const _orders$ = connection$.pipe(
    switchMap(() => streamResultToObservable(service().getAllOrders())),
    map(
        (order): OrderUpdate => ({
            action: 'create',
            order,
        }),
    ),
)

const stream$ = connection$.pipe(switchMap(() => streamResultToObservable(service().orderStream())))

const combined$ = merge(_orders$, stream$).pipe(
    scan((acc, { action, order }) => {
        if (action === 'delete') {
            acc.delete(order.orderId)
        } else if (acc.has(order.orderId) && action === 'create') {
            // skip. Assume the update is more recent
        } else {
            acc.set(order.orderId, order)
        }
        return acc
    }, new Map<number, Order>()),
    throttleTime(100, undefined, { trailing: true }),
    map(orders => Array.from(orders.values())),
)

export const [useOrders, orders$] = bind(() => combined$)
