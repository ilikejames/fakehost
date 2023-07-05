import {
    HubConnectionBuilder,
    Order,
    OrderUpdate,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { of, from, map, merge, scan, shareReplay, switchMap, throttleTime } from 'rxjs'
import { config } from '@/config'
import { fakeServicesReady } from '@/fakeServices'

const connection$ = from(fakeServicesReady).pipe(
    switchMap(() => {
        const hub = new HubConnectionBuilder()
            .withUrl(new URL('/orderhub', config.signalrUrl).toString())
            .build()

        return from(hub.start()).pipe(map(() => hub))
    }),
    shareReplay(1),
)

const service$ = connection$.pipe(
    switchMap(connection => of(getHubProxyFactory('IOrderHub').createHubProxy(connection))),
    shareReplay(1),
)

const _orders$ = service$.pipe(
    switchMap(service => streamResultToObservable(service.getAllOrders())),
    map(
        (order): OrderUpdate => ({
            action: 'create',
            order,
        }),
    ),
)

const stream$ = service$.pipe(switchMap(service => streamResultToObservable(service.orderStream())))

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
