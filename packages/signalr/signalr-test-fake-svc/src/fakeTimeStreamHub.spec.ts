import {
    getHubProxyFactory,
    streamResultToObservable,
    HubConnectionBuilder,
} from '@fakehost/signalr-test-client-api'
import { Subject as SignalrSubject } from '@microsoft/signalr'
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import { Subject, bufferCount, catchError, firstValueFrom, of, timer } from 'rxjs'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { protocols, testSetup, getTestTarget, TestEnv } from './testSetup'

for (const protocol of protocols) {
    describe(`${getTestTarget()}: TimeStreamHub (${protocol})`, () => {
        let fake: TestEnv

        beforeAll(async () => {
            fake = await testSetup(getTestTarget())
        })

        const getConnection = async () => {
            const url = `${fake.url}timehub`
            const connectionBuilder = new HubConnectionBuilder().withUrl(url)
            if (protocol === 'messagepack') {
                connectionBuilder.withHubProtocol(new MessagePackHubProtocol())
            }
            const connection = connectionBuilder.build()
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
            const subject = new Subject<string>()

            try {
                proxy.clientToServerStreaming(extendSubject(subject))

                Array.from({ length: 6 }).forEach((_, i) => {
                    subject.next(`count: ${i}`)
                })
                subject.complete()

                await firstValueFrom(timer(1000))
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

        test('alwaysErrors', async () => {
            const { connection, proxy } = await getConnection()
            expect.assertions(1)
            try {
                const [result] = await firstValueFrom(
                    streamResultToObservable(proxy.alwaysErrors()).pipe(
                        catchError(err => of(err)),
                        bufferCount(1),
                    ),
                )
                expect(result).toMatchObject({
                    name: 'Error',
                    message: expect.stringMatching(/^An unexpected error occurred invoking/),
                })
            } finally {
                await connection.stop()
            }
        })

        test('alwaysErrorsOnTheSecondEmit', async () => {
            const { connection, proxy } = await getConnection()
            expect.assertions(2)
            try {
                const [result, error] = await firstValueFrom(
                    streamResultToObservable(proxy.alwaysErrorsOnTheSecondEmit()).pipe(
                        catchError(err =>
                            of({
                                name: err.name,
                                message: err.message,
                            }),
                        ),
                        bufferCount(2),
                    ),
                )
                expect(result).toMatch('first')
                expect(error).toMatchObject({
                    name: 'Error',
                    message: 'An error occurred on the server while streaming results.',
                })
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
}
