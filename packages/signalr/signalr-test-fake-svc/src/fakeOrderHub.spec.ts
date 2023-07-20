import {
    HubConnectionBuilder,
    Order,
    OrderStatus,
    OrderUpdate,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import { filter, firstValueFrom, reduce, scan } from 'rxjs'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { protocols, Protocols, TestEnv, getTestTarget, testSetup } from './testSetup'
import { orderState } from './state'

for (const protocol of protocols) {
    describe(`${getTestTarget()}: OrderHub (${protocol})`, () => {
        let env: TestEnv

        beforeAll(async () => {
            env = await testSetup(getTestTarget())
            orderState.generator.start()
        })

        afterAll(() => env.dispose())

        test('getAllOrders', async () => {
            const { proxy } = await getConnection(env, protocol)
            const result = await firstValueFrom(
                streamResultToObservable(proxy.getAllOrders()).pipe(
                    reduce((acc, item) => {
                        acc.set(item.orderId, item)
                        return acc
                    }, new Map<number, Order>()),
                ),
            )
            expect(result.size).toBeGreaterThan(0)
        })

        test('orderStream', async () => {
            const { proxy } = await getConnection(env, protocol)
            const result = await firstValueFrom(
                streamResultToObservable(proxy.orderStream()).pipe(
                    scan(
                        (acc, item) => {
                            acc.all.push(item)
                            acc.map.set(item.order.orderId, item.order)
                            return acc
                        },
                        { all: new Array<OrderUpdate>(), map: new Map<number, Order>() },
                    ),
                    filter(x =>
                        // wait until we have a filled order
                        Boolean(x.all.find(x => x.order.status === OrderStatus.Filled)),
                    ),
                ),
            )
            expect(result.all.map(x => x.action)).toMatch(/(create|update|delete)/)
            const filled = result.all.filter(x => x.order.status === OrderStatus.Filled)
            filled.forEach(filledItem => {
                expect(filledItem.order.filledQuantity).toBe(filledItem.order.totalQuantity)
            })
        }, 10_000)
    })
}

const getConnection = async (fake: TestEnv, protocol: Protocols) => {
    const url = new URL('/orderhub', fake.url)
    const connectionBuilder = new HubConnectionBuilder().withUrl(url.toString())
    if (protocol === 'messagepack') {
        connectionBuilder.withHubProtocol(new MessagePackHubProtocol())
    }
    const connection = connectionBuilder.build()
    await connection.start()

    const proxy = getHubProxyFactory('IOrderHub').createHubProxy(connection)

    return {
        proxy,
        connection,
    }
}
