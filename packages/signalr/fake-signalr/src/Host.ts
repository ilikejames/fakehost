import * as WS from 'ws'
import { createServer, Server } from 'http'
import { v4 as uuid } from 'uuid'
import { Connection } from '@fakehost/exchange'
import { ProtocolHandler } from './protocolHandler'

export type HostOptions = {
    port: number
    debug: boolean
}

export class Host {
    private http: Server
    private ws: WS.Server
    private connectionIds = new Set<string>()
    private connectionTokens = new Set<string>()
    private sockets = new Map<string, WS.WebSocket>()
    private readonly connections = new Map<string, Connection & { path: string }>()
    public readonly port: Promise<number>

    constructor(
        private handlers: ProtocolHandler<unknown, unknown>[],
        options?: Partial<HostOptions>,
    ) {
        this.http = createServer()
        this.ws = new WS.WebSocketServer({ server: this.http })

        this.http.on('request', (_, res) => {
            const connectionId = uuid()
            const connectionToken = uuid()
            this.connectionIds.add(connectionId)
            this.connectionTokens.add(connectionToken)

            res.write(
                JSON.stringify({
                    negotiateVersion: 1,
                    connectionId: connectionId,
                    connectionToken: connectionToken,
                    availableTransports: [
                        { transport: 'WebSockets', transferFormats: ['Text', 'Binary'] },
                        { transport: 'ServerSentEvents', transferFormats: ['Text'] },
                        { transport: 'LongPolling', transferFormats: ['Text', 'Binary'] },
                    ],
                }),
            )
            res.end()
        })

        this.port = new Promise(resolve => {
            this.http.listen(options?.port ?? 0, () => {
                const addressInfo = this.http.address() as WS.AddressInfo
                resolve(addressInfo.port)
                console.log('listening on ', addressInfo.port)
            })
        })

        this.ws.on('connection', async (socket, req) => {
            const url = new URL(`http://localhost:${await this.port}${socket.url || req.url || ''}`)
            const connectionId = url.searchParams.get('id') || ''
            this.sockets.set(connectionId, socket)

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this
            const connection = {
                close: () => this.close(connectionId),
                id: connectionId,
                write: (message: string) => {
                    socket.send(message)
                },
                get isClosed() {
                    return self.sockets.has(connectionId)
                },
                query: {},
                path: url.pathname,
            }
            this.connections.set(connectionId, connection)

            this.handlers
                .filter(handler => handler.path === url.pathname)
                .forEach(handler => {
                    handler.onConnection && handler.onConnection(connection)
                })

            socket.on('message', (raw: string | Buffer) => {
                const handlers = this.handlers.filter(handler => handler.path === url.pathname)
                handlers.forEach(handler => {
                    const message = handler.deserialize(raw)
                    handler.onMessage(connection, message)
                })
            })
        })
    }

    close(connectionId: string) {
        const socket = this.sockets.get(connectionId)
        const connection = this.connections.get(connectionId)
        if (socket && connection) {
            socket.close()
            this.handlers.forEach(handler => {
                handler.onDisconnection && handler.onDisconnection(connection)
            })
            this.connectionIds.delete(connectionId)
            this.sockets.delete(connectionId)
            this.connections.delete(connectionId)
        }
    }

    dispose() {
        this.ws.clients.forEach(client => {
            client.close()
        })
        this.ws.close()
        this.http.close()
    }
}
