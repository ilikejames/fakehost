import { IChatReceiver, getHubProxyFactory, getReceiverRegister } from '@fakehost/signalr-test-api'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import { testSetup, TestEnv, getTestTarget } from './testSetup'

describe(`${getTestTarget()}:fake-signalr`, () => {
    let fake: TestEnv

    beforeAll(async () => {
        fake = await testSetup()
    })

    afterAll(() => fake.dispose())

    test('IChatHub invocation', async () => {
        const { connection: connection1, proxy: proxy1 } = await getConnection()
        const { connection: connection2, proxy: proxy2 } = await getConnection()

        try {
            await proxy1.join('test-username')
            expect(await proxy1.getParticipants()).toEqual(['test-username'])

            await proxy2.join('test-username2')

            expect((await proxy1.getParticipants()).sort()).toEqual(
                ['test-username', 'test-username2'].sort(),
            )
            await proxy1.leave()

            expect(await proxy1.getParticipants()).toEqual(['test-username2'])
            expect(await proxy2.getParticipants()).toEqual(['test-username2'])
        } finally {
            await Promise.all([connection1.stop(), connection2.stop()])
        }
    })

    test('IChatHub onJoin/onLeave', async () => {
        const onJoinConnection1: IChatReceiver['onJoin'] = vi.fn()
        const onLeaveConnection1: IChatReceiver['onLeave'] = vi.fn()
        const onJoinConnection2: IChatReceiver['onJoin'] = vi.fn()
        const onLeaveConnection2: IChatReceiver['onLeave'] = vi.fn()

        const { connection: connection1, proxy: proxy1 } = await getConnection({
            onJoin: onJoinConnection1,
            onLeave: onLeaveConnection1,
        })
        const { connection: connection2, proxy: proxy2 } = await getConnection({
            onJoin: onJoinConnection2,
            onLeave: onLeaveConnection2,
        })

        try {
            await proxy1.join('test-username')
            await new Promise(resolve => setTimeout(resolve, 500))

            expect(onJoinConnection1).toHaveBeenLastCalledWith('test-username', expect.any(String))
            expect(onJoinConnection2).toHaveBeenLastCalledWith('test-username', expect.any(String))

            await proxy2.join('test-username2')
            await new Promise(resolve => setTimeout(resolve, 500))

            expect(onJoinConnection1).toHaveBeenLastCalledWith('test-username2', expect.any(String))
            expect(onJoinConnection2).toHaveBeenLastCalledWith('test-username2', expect.any(String))

            await proxy1.leave()
            await new Promise(resolve => setTimeout(resolve, 500))

            expect(onLeaveConnection1).toHaveBeenCalledWith('test-username', expect.any(String))
            expect(onLeaveConnection2).toHaveBeenCalledWith('test-username', expect.any(String))
        } finally {
            await Promise.all([connection1.stop(), connection2.stop()])
        }
    })

    type Receivers = {
        [K in keyof IChatReceiver]: IChatReceiver[K]
    }

    const getConnection = async (receivers?: Partial<Receivers>) => {
        const url =
            getTestTarget() === 'FAKE' ? `${fake.url}/chathub` : 'http://localhost:5001/chathub'

        const connection = new HubConnectionBuilder().withUrl(url).build()

        await connection.start()

        const proxy = getHubProxyFactory('IChatHub').createHubProxy(connection)

        const notifier = getReceiverRegister('IChatReceiver').register(connection, {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onReceiveMessage: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onLeave: async () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onJoin: async () => {},
            ...receivers,
        })

        return {
            proxy,
            connection,
            notifier,
        }
    }
})
