import {
    getHubProxyFactory,
    streamResultToObservable,
    ClientItem,
} from '@fakehost/signalr-test-api'
import { HubConnectionBuilder, Subject as SignalrSubject } from '@microsoft/signalr'
import { Subject, bufferCount, firstValueFrom, timer } from 'rxjs'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { testSetup, getTestTarget, TestEnv } from './testSetup'

describe(`${getTestTarget()}:fake-signalr`, () => {
    let fake: TestEnv

    beforeAll(async () => {
        fake = await testSetup(getTestTarget())
    })

    const getConnection = async () => {
        const url = `${fake.url}timehub`
        const connection = new HubConnectionBuilder().withUrl(url).build()
        await connection.start()

        const proxy = getHubProxyFactory('ITimeStreamHub').createHubProxy(connection)

        return {
            proxy,
            connection,
        }
    }

    afterAll(() => fake.dispose())

    test('TimeStream: service -> client', async () => {
        const { connection, proxy } = await getConnection()
        const stream$ = streamResultToObservable(proxy.streamTimeAsync(1))

        try {
            const result = await firstValueFrom(stream$.pipe(bufferCount(3)))
            const [first, second, third] = result.map(x => new Date(x))
            expect(third.getTime() - second.getTime()).toBeGreaterThanOrEqual(990)
            expect(third.getTime() - second.getTime()).toBeLessThan(1100)

            expect(second.getTime() - first.getTime()).toBeGreaterThanOrEqual(990)
            expect(second.getTime() - first.getTime()).toBeLessThan(1100)
        } finally {
            await Promise.all([connection.stop()])
        }
    })

    test('TimeStream: client -> service', async () => {
        const { connection, proxy } = await getConnection()
        const subject = new Subject<ClientItem>()

        try {
            proxy.clientToServerStreaming(extendSubject(subject))

            Array.from({ length: 6 }).forEach((_, i) => {
                subject.next({ content: `count: ${i}` })
            })
            subject.complete()

            await firstValueFrom(timer(500))
            const results = await proxy.getUploaded()
            expect(results.sort()).toEqual([
                'count: 0',
                'count: 1',
                'count: 2',
                'count: 3',
                'count: 4',
                'count: 5',
            ])
        } finally {
            await connection.stop()
        }
    })

    const extendSubject = <T>(s: Subject<T>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = s as any
        a.dispose = () => s.unsubscribe()
        return a as SignalrSubject<T>
    }
})
