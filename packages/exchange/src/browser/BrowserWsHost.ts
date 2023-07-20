import { blobToArrayBuffer } from 'blob-util'
import chalk from 'chalk'
import { Server, WebSocket } from 'mock-socket'
import { URL } from 'url'
import { v4 as uuid } from 'uuid'
import { BaseHost, CloseOptions, Host, HostOptions, getCloseOptions } from '../ws/Host'
import { logger } from '../logger'
import { ConnectionId, Connection } from '../types'

export type BrowserWsHostOptions = Partial<HostOptions> & {
    url: URL
}

export const MockedSocket = function (url: string | URL, protocols?: string | string[]) {
    return new WebSocket(url, protocols)
}

/**
 * For mocking out the websocket inside the browser.
 * For bundling directly in a DOM environment e.g. :
 *  - unit testing browser code with js-dom for jest or happy-dom in vitest
 *  - bundling within browsers such as for Storybook
 *  - browser hosted tests such as Cypress
 */
export class BrowserWsHost extends BaseHost implements Host {
    private options: BrowserWsHostOptions
    public readonly WebSocket = MockedSocket
    private server: Server
    public readonly url: Promise<URL>
    private pathConnections = new Map<string, ConnectionId[]>()

    constructor(options: BrowserWsHostOptions) {
        super()
        this.options = {
            ...options,
            name: `ws:${options.name}` || 'BrowserWsHost',
        }

        this.url = Promise.resolve(this.options.url)
        this.server = new Server(this.options.url.toString(), {})
        if (!options.silent) {
            console.log(
                chalk.green(`${this.options.name}: Hijacking ${this.options.url.toString()}`),
            )
        }

        this.server.on('connection', client => {
            if (this.refuseNewConnections) {
                logger(`${this.options.name}: Refusing new connection`)
                client.close()
                return
            }

            const connectionId = uuid() as ConnectionId
            const url = this.getUrl(client.url)

            // connections per path
            const pathConnections = this.pathConnections.get(url.pathname) || []
            this.pathConnections.set(url.pathname, [...pathConnections, connectionId])

            logger(`${this.options.name}: New connection ${connectionId}`)
            const connection: Connection = {
                id: connectionId,
                url: this.options.url,
                close: client.close,
                write: (raw: string | Buffer) => {
                    logger(chalk.red('←'), `${raw}`)
                    client.send(raw)
                },
            }
            this.handlers.connection.forEach(handler => handler({ type: 'connection', connection }))
            this.connections.set(connectionId, connection)

            client.on('close', () => {
                this.handlers.disconnection.forEach(handler =>
                    handler({ type: 'disconnection', connection }),
                )
                this.connections.delete(connectionId)
            })

            client.on('message', async raw => {
                let result: string | Buffer
                logger(chalk.green('→'), `${raw}`)
                // convert the raw message to a string or Buffer to match with a network message
                if (typeof raw === 'string') {
                    result = raw
                } else if (raw instanceof Blob) {
                    result = Buffer.from(await blobToArrayBuffer(raw))
                } else if (raw instanceof ArrayBuffer) {
                    result = Buffer.from(raw)
                } else if (ArrayBuffer.isView(raw)) {
                    result = Buffer.from(raw.buffer)
                }
                this.handlers.message.forEach(handler =>
                    handler({ type: 'message', connection, message: result }),
                )
            })
        })
    }

    private getUrl(url: string): URL {
        try {
            return new URL(url)
        } catch {
            return this.options.url
        }
    }

    disconnect(options?: Partial<CloseOptions>): void {
        const { path, code, reason, wasClean } = getCloseOptions(options)
        // TODO: this cannot be done with mock-socket
        const connectionIds =
            path && this.pathConnections.has(path)
                ? this.pathConnections.get(path) ?? []
                : [...this.connections.keys()]
        connectionIds.forEach(connectionId => {
            const connection = this.connections.get(connectionId)
            if (!connection) return
            logger(chalk.yellow(`${this.options.name}: Disconnecting connection ${connection.id}`))
            connection.close({ code, reason, wasClean })
            this.connections.delete(connectionId)
        })
        path && this.pathConnections.delete(path)
    }

    dispose(): Promise<void> {
        this.server.close({ reason: 'dispose', code: 500, wasClean: true })
        return new Promise(resolve => {
            this.server.stop(() => {
                logger(chalk.yellow(`${this.options.name}: Disposed mock websocket service`))
                resolve()
            })
        })
    }
}
