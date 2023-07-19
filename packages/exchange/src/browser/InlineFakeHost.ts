import chalk from 'chalk'
import { Client, Server, WebSocket as MockedSocket } from 'mock-socket'
import { URL } from 'url'
import { ProtocolHandler } from '../deprecated/ProtocolHandler'
import { BaseFakeHost, CloseOptions, HostOptions } from '../deprecated/BaseFakeHost'
import { Connection, ConnectionId } from '../types'
import { enableLogger, logger } from '../logger'

/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export class InlineFakeHost extends BaseFakeHost {
    private readonly fakeUrl!: string
    private server?: Server
    private connection?: Connection
    private client?: Client
    public Websocket = MockedSocket

    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protocolHandler: ProtocolHandler<any, any>,
        url = 'ws://localhost:5555',
        private readonly options: HostOptions = { name: 'InlineFakeHost ' },
    ) {
        super(protocolHandler)
        this.fakeUrl = url
        this.start()
        options.debug && enableLogger()
    }

    get url(): Promise<string> {
        return Promise.resolve(this.fakeUrl)
    }

    async dispose(): Promise<void> {
        if (!this.server) return await Promise.resolve()
        this.server.stop()
        this.client?.close()
        if (this.connection) {
            super.onClose(this.connection.id)
        }
        return await Promise.resolve()
    }

    disconnect(options?: Partial<CloseOptions>) {
        this.client?.close(
            options
                ? {
                      code: 1000,
                      reason: '',
                      wasClean: true,
                      ...options,
                  }
                : undefined,
        )
    }

    start() {
        this.server = new Server(this.fakeUrl, {})
        console.log(chalk.green(`${this.options.name}: Started on ${this.fakeUrl}`))

        this.server.on('connection', client => {
            if (this.refuseNewConnections) {
                logger(`${this.options.name}: Refusing new connection`)
                client.close()
                return
            }
            this.client = client
            const connectionId = `fake-${Date.now().toString()}` as ConnectionId
            this.connection = {
                id: connectionId,
                url: this.getUrl(client.url),
                close: ({ code, reason }) => client.close({ code, reason, wasClean: true }),
                write: (raw: string | Buffer) => client.send(raw),
            }

            super.onConnection(this.connection)

            client.on('close', () => {
                super.onClose(connectionId)
            })

            client.on('message', (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
                if (typeof data === 'string' && this.connection) {
                    super.onMessage(this.connection, data)
                }
            })
        })
    }

    private getUrl(url: string): URL {
        try {
            return new URL(url)
        } catch {
            return new URL(this.fakeUrl)
        }
    }
}
