import * as WS from 'ws'
import { Server } from 'http'
import { Connection, ProtocolHandler, ConnectionId } from '@fakehost/exchange'
import chalk from 'chalk'

export type HostOptions = {
    port: number
    debug: boolean
    name: string
    server: WS.ServerOptions['server']
}

export class Host {
    // private http: Server
    private ws: WS.Server
    private sockets = new Map<ConnectionId, WS.WebSocket>()
    private readonly connections = new Map<ConnectionId, Connection>()
    private _port: Promise<number>

    get port() {
        return this._port
    }

    constructor(private handlers: ProtocolHandler<any, any>[], options?: Partial<HostOptions>) {
        // this.http = createServer()
        // this.ws = new WS.WebSocketServer({ server: this.http })
        this.ws = new WS.WebSocketServer({ ...options })

        /*
        this.http.on('request', (_, res) => {
            const connectionId = uuid() as ConnectionId
            const connectionToken = uuid()

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
        */

        // this.port = new Promise(resolve => {
        //     this.http.listen(options?.port ?? 0, () => {
        //         const addressInfo = this.http.address() as WS.AddressInfo
        //         resolve(addressInfo.port)
        //         console.log('listening on ', addressInfo.port)
        //     })
        // })

        const resolveAddress = (
            resolve: (value: number) => void,
            source: { address: Server['address'] | WS.Server['address'] },
        ) => {
            const address = source.address && source.address()
            if (address && typeof address === 'object' && 'port' in address) {
                resolve(address.port as number)
                const name = options?.name ?? 'WSHost'
                console.log(chalk.green(`${name}: Started on ${address.port}`))
            }
        }

        this._port = new Promise(resolve => {
            if (options?.server && options.server) {
                resolveAddress(resolve, options.server)
            }
            this.ws.on('listening', () => {
                resolveAddress(resolve, this.ws)
            })
        })

        this.ws.on('connection', async (socket, req) => {
            const url = new URL(`http://localhost:${await this.port}${socket.url || req.url || ''}`)
            const connectionId = (url.searchParams.get('id') || '') as ConnectionId
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

    close(connectionId: ConnectionId) {
        const socket = this.sockets.get(connectionId)
        const connection = this.connections.get(connectionId)
        if (socket && connection) {
            socket.close()
            this.handlers.forEach(handler => {
                handler.onDisconnection && handler.onDisconnection(connection)
            })
            this.sockets.delete(connectionId)
            this.connections.delete(connectionId)
        }
    }

    dispose() {
        this.ws.clients.forEach(client => {
            client.close()
        })
        this.ws.close()
        //this.http.close()
    }
}
