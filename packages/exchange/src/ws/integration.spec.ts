import IsoMorphicWebSocket from 'isomorphic-ws'
import { describe, it, expect, vi } from 'vitest'
import { BrowserWsHost } from '../browser/BrowserWsHost'
import { WsHost } from './WsHost'
import { Host } from './Host'
import { enableLogger } from '../logger'

globalThis.WebSocket = globalThis.WebSocket || IsoMorphicWebSocket

const hosts = ['Browser', 'Service'] as const

enableLogger()

for (const host of hosts) {
    describe(`${host}: Integration`, () => {
        it('connection & client disconnection', async () => {
            const service = getService(host)
            try {
                const url = await service.url
                const connection = vi.fn()
                const disconnect = vi.fn()
                service.on('connection', connection)
                service.on('disconnection', disconnect)

                const client = new globalThis.WebSocket(url)

                await new Promise(resolve => client.addEventListener('open', resolve))

                expect(connection).toBeCalledTimes(1)
                const onConnectionArgs = connection.mock.calls[0]
                expect(onConnectionArgs[0]).toEqual({
                    type: 'connection',
                    connection: {
                        id: expect.any(String),
                        url: expect.any(URL),
                        close: expect.any(Function),
                        write: expect.any(Function),
                    },
                })
                expect(onConnectionArgs[0].connection.url.toString()).toEqual(
                    (await service.url).toString(),
                )
                client.close()
                await new Promise(resolve => service.on('disconnection', resolve))
                expect(disconnect).toBeCalledTimes(1)
                expect(disconnect.mock.calls[0][0]).toEqual({
                    type: 'disconnection',
                    connection: {
                        id: expect.any(String),
                        url: expect.any(URL),
                        close: expect.any(Function),
                        write: expect.any(Function),
                    },
                })
                expect(disconnect.mock.calls[0][0].connection.id).toEqual(
                    onConnectionArgs[0].connection.id,
                )
            } finally {
                await service.dispose()
            }
        })

        it('multiple connections', async () => {
            const service = getService(host)
            try {
                const url = await service.url
                const connection = vi.fn()
                const disconnect = vi.fn()
                service.on('connection', connection)
                service.on('disconnection', disconnect)

                const client1 = new globalThis.WebSocket(url)
                await new Promise(resolve => client1.addEventListener('open', resolve))
                const client1ConnectionId = connection.mock.calls[0][0].connection.id

                const client2 = new globalThis.WebSocket(url)
                await new Promise(resolve => client2.addEventListener('open', resolve))
                const client2ConnectionId = connection.mock.calls[1][0].connection.id

                // connectionIds should be unique for each client
                expect(client1ConnectionId).not.toEqual(client2ConnectionId)
                expect(service.connectionCount).toBe(2)

                // close client1
                client1.close()
                await new Promise(resolve => service.on('disconnection', resolve))
                expect(disconnect.mock.calls[0][0].connection.id).toEqual(client1ConnectionId)
                expect(service.connectionCount).toBe(1)

                // close client2
                client2.close()
                await new Promise(resolve => service.on('disconnection', resolve))
                expect(disconnect.mock.calls[1][0].connection.id).toEqual(client2ConnectionId)
                expect(service.connectionCount).toBe(0)
            } finally {
                await service.dispose()
            }
        })

        it('service disconnecting clients', async () => {
            const service = getService(host)
            try {
                expect(service.connectionCount).toBe(0)

                const client1 = new globalThis.WebSocket(await service.url)
                const client2 = new globalThis.WebSocket(await service.url)

                await Promise.all([
                    new Promise(resolve => client1.addEventListener('open', resolve)),
                    new Promise(resolve => client2.addEventListener('open', resolve)),
                ])
                expect(service.connectionCount).toBe(2)

                service.disconnect()
                const closeEvents = await Promise.all([
                    new Promise<CloseEvent>(resolve => client1.addEventListener('close', resolve)),
                    new Promise<CloseEvent>(resolve => client2.addEventListener('close', resolve)),
                ])
                expect(service.connectionCount).toBe(0)

                closeEvents.forEach(evt => {
                    expect(evt.code).toEqual(1000)
                    expect(evt.reason).toEqual('Service disconnected')
                })
            } finally {
                await service.dispose()
            }
        })

        it('service disconnecting clients with a specific code', async () => {
            const service = getService(host)
            try {
                expect(service.connectionCount).toBe(0)

                const client1 = new globalThis.WebSocket(await service.url)
                const client2 = new globalThis.WebSocket(await service.url)

                await Promise.all([
                    new Promise(resolve => client1.addEventListener('open', resolve)),
                    new Promise(resolve => client2.addEventListener('open', resolve)),
                ])
                expect(service.connectionCount).toBe(2)

                const closeOptions = { code: 4012, reason: 'Too many connections ' }
                service.disconnect(closeOptions)
                const closeEvents = await Promise.all([
                    new Promise<CloseEvent>(resolve => client1.addEventListener('close', resolve)),
                    new Promise<CloseEvent>(resolve => client2.addEventListener('close', resolve)),
                ])
                expect(service.connectionCount).toBe(0)

                closeEvents.forEach(evt => {
                    expect(evt.code).toEqual(closeOptions.code)
                    expect(evt.reason).toEqual(closeOptions.reason)
                })
            } finally {
                await service.dispose()
            }
        })

        it('client sending/receiving messages', async () => {
            const service = getService(host)

            // create a simple echo service,
            // that replies with the same message and the clients connectionId
            service.on('message', ({ connection, message }) => {
                connection.write(
                    JSON.stringify({
                        echo: JSON.parse(message.toString()),
                        connectionId: connection.id,
                    }),
                )
            })
            try {
                const client1 = new globalThis.WebSocket(await service.url)
                const client2 = new globalThis.WebSocket(await service.url)

                await Promise.all([
                    new Promise(resolve => client1.addEventListener('open', resolve)),
                    new Promise(resolve => client2.addEventListener('open', resolve)),
                ])

                const client1MessagePromise = new Promise<string>(resolve =>
                    client1.addEventListener('message', e => resolve(e.data)),
                )
                const client2MessagePromise = new Promise<string>(resolve =>
                    client2.addEventListener('message', e => resolve(e.data)),
                )

                client1.send(JSON.stringify('hello from client1'))
                client2.send(JSON.stringify('hello from client2'))

                const client1Message = await client1MessagePromise
                const client2Message = await client2MessagePromise

                expect(JSON.parse(client1Message)).toEqual({
                    echo: 'hello from client1',
                    connectionId: expect.any(String),
                })
                expect(JSON.parse(client2Message)).toEqual({
                    echo: 'hello from client2',
                    connectionId: expect.any(String),
                })
            } finally {
                await service.dispose()
            }
        })
    })
}

const getUrl = () => {
    const port = `${Date.now()}`.slice(-4)
    const url = new URL(`ws://localhost:${port}/json`)
    return url
}

const getService = (host: (typeof hosts)[number]): Host => {
    switch (host) {
        case 'Browser':
            return new BrowserWsHost({
                name: 'TestHost',
                url: getUrl(),
            })
        case 'Service':
            return new WsHost({ name: 'TestHost', port: 0, path: '/json' })
    }
}
