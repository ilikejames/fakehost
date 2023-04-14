import { blobToArrayBuffer } from 'blob-util'
import chalk from 'chalk'
import { Server } from 'mock-socket'
import { URL } from 'url'
import { v4 as uuid } from 'uuid'
import { BaseHost, HostOptions } from './Host'
import { logger } from './logger'
import { ConnectionId, Connection } from './types'

export type BrowserWsHostOptions = Partial<HostOptions> & {
    url: URL
}

/**
 * For mocking out the websocket inside the browser.
 * For bunding directly in a DOM environment e.g. :
 *  - unit testing browser code with js-dom for jest or happy-dom in vitest
 *  - bundling within browsers such as for Storybook
 *  - browser hosted tests such as Cypress
 */
export class BrowserWsHost extends BaseHost {
    private _options: BrowserWsHostOptions
    private server: Server
    public readonly url: Promise<URL>

    constructor(options: BrowserWsHostOptions) {
        super()
        this._options = {
            ...options,
            name: `ws:${options.name}` || 'BrowserWsHost',
        }

        this.url = Promise.resolve(this._options.url)
        this.server = new Server(this._options.url.toString(), {})
        if (!options.silent) {
            console.log(
                chalk.green(`${this._options.name}: Hijacking ${this._options.url.toString()}`),
            )
        }

        this.server.on('connection', client => {
            if (this.refuseNewConnections) {
                logger(`${this._options.name}: Refusing new connection`)
                client.close()
                return
            }

            const connectionId = uuid() as ConnectionId
            logger(`${this._options.name}: New connection ${connectionId}`)
            const connection: Connection = {
                id: connectionId,
                url: this._options.url,
                close: client.close,
                write: (raw: string | Buffer) => client.send(raw),
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

    disconnect(): void {
        this.connections.forEach(connection => {
            logger(chalk.yellow(`${this._options.name}: Disconnecting connection ${connection.id}`))
            connection.close()
        })
    }

    dispose(): Promise<void> {
        this.server.close({ reason: 'dispose', code: 500, wasClean: true })
        return new Promise(resolve => {
            this.server.stop(() => {
                logger(chalk.yellow(`${this._options.name}: Disposed mock websocket service`))
                resolve()
            })
        })
    }
}
