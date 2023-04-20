import chalk from 'chalk'
import { URL } from 'url'
import { v4 as uuid } from 'uuid'
import { WebSocketServer, ServerOptions, Server } from 'ws'
import { BaseHost, HostOptions } from './Host'
import { logger } from './logger'
import { ConnectionId, Connection } from './types'

export type WsStandaloneOptions = HostOptions & {
    port?: number
    path?: string
}

export type WsHostedOptions = HostOptions & {
    server: ServerOptions['server']
}

export type WsHostOptions = WsStandaloneOptions | WsHostedOptions

/**
 * A service host that uses websockets to communicate with clients over the local network
 * For starting from :
 *  - command line
 *  - nodejs test frameworks such as jest, Playwright, etc.
 */
export class WsHost extends BaseHost {
    private ws: WebSocketServer
    private options: Partial<WsHostOptions> = {}
    public readonly port: Promise<number>
    public readonly url: Promise<URL>
    private pathConnections = new Map<string, ConnectionId[]>()

    constructor(options?: Partial<WsHostOptions>) {
        super()
        this.options = {
            name: 'WsHost',
            ...options,
        }

        this.ws = new WebSocketServer(options)

        this.port = new Promise(resolve => {
            logger('finding port...')
            if ('server' in this.options) {
                logger('on server')
                this.resolveAddress(resolve, this.options.server)
                return
            }
            this.ws.on('listening', () => {
                logger('listening')
                this.resolveAddress(resolve, this.ws)
            })
        })

        this.url = this.port.then(port => {
            if ('path' in this.options) {
                return new URL(`ws://localhost:${port}${this.options.path}`)
            }
            if ('server' in this.options) {
                return new URL(`http://localhost:${port}`)
            }
            return new URL(`ws://localhost:${port}`)
        })

        this.ws.on('connection', async (socket, request) => {
            if (this.refuseNewConnections) {
                logger(`${this.options.name}: Refusing new connection`)
                socket.close()
                return
            }

            const id = uuid() as ConnectionId
            const requestUrl = new URL(request.url || '', await this.url)

            // append to connection path for disconnection?
            const pathConnections = this.pathConnections.get(requestUrl.pathname) || []
            this.pathConnections.set(requestUrl.pathname, [...pathConnections, id])

            const connection: Connection = {
                id,
                url: requestUrl,
                close: () => {
                    socket.close()
                    this.connections.delete(connection.id)
                },
                write: (raw: string | Buffer) => {
                    socket.send(raw)
                },
            }
            logger(chalk.yellow(`${this.options.name}: Client connected ${connection.id}`))
            this.connections.set(connection.id, connection)

            this.handlers.connection.forEach(handler => handler({ type: 'connection', connection }))

            socket.on('close', async () => {
                logger(chalk.yellow(`${this.options.name}: Client disconnected ${connection.id}`))
                this.handlers.disconnection.forEach(handler =>
                    handler({ type: 'disconnection', connection }),
                )
                this.connections.delete(connection.id)
            })

            socket.on('message', (raw: string | Buffer) => {
                this.handlers.message.forEach(handler =>
                    handler({ type: 'message', connection, message: raw }),
                )
            })
        })
    }

    disconnect(path?: string): void {
        const connections =
            path && this.pathConnections.has(path)
                ? this.pathConnections.get(path) ?? []
                : Array.from(this.connections.keys())

        connections.forEach(connectionId => {
            const connection = this.connections.get(connectionId)
            if (connection) {
                logger(
                    chalk.yellow(`${this.options.name}: Disconnecting connection ${connection.id}`),
                )
                connection.close()
                this.connections.delete(connection.id)
            }
        })
        path && this.pathConnections.delete(path)
    }

    dispose(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.disconnect()
            this.ws.close(err => {
                if (err) {
                    logger(
                        chalk.red(`${this.options.name}: Failed to tear down connection. ${err}`),
                    )
                    reject(err)
                } else {
                    logger(chalk.red(`${this.options.name}: Closed.`))
                    resolve()
                }
            })
        })
    }

    private resolveAddress(
        resolve: (value: number) => void,
        source?: { address: () => AllAddressInfoOptions },
    ) {
        const address = source?.address && source.address()
        if (address && typeof address === 'object' && 'port' in address) {
            resolve(address.port as number)
            const name = this.options.name
            if (!this.options.silent) {
                console.log(chalk.green(`${name}: Started on ${address.port}`))
            }
        }
    }
}

type AllAddressInfoOptions = ReturnType<Server['address'] | WebSocketServer['address']> | null
