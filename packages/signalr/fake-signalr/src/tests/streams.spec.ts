import { getHubProxyFactory, streamResultToObservable, ClientItem } from '@fakehost/signalr-test-api'
import { HubConnectionBuilder, Subject as SignalrSubject } from '@microsoft/signalr'
import { Subject, bufferCount, firstValueFrom, skip, tap, timer } from 'rxjs'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { testSetup, getTestTarget, TestEnv } from './testSetup'

describe(`${getTestTarget()}:fake-signalr`, () => {
    let fake: TestEnv

    beforeAll(async () => {
        fake = await testSetup()
    })

    const getConnection = async () => {
        const url = getTestTarget() === 'FAKE' ? `${fake.url}/timehub` : 'http://localhost:5002/timehub'

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
            expect(third.getTime() - second.getTime()).toBeGreaterThanOrEqual(1000)
            expect(third.getTime() - second.getTime()).toBeLessThan(1100)

            expect(second.getTime() - first.getTime()).toBeGreaterThanOrEqual(1000)
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
            expect(results.sort()).toEqual(['count: 0', 'count: 1', 'count: 2', 'count: 3', 'count: 4', 'count: 5'])
        } finally {
            await connection.stop()
        }
    })

    const extendSubject = <T>(s: Subject<T>) => {
        const a = s as any
        a.dispose = () => s.unsubscribe()
        return a as SignalrSubject<T>
    }
})
