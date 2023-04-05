import chalk from 'chalk'
import { Client, Server, WebSocket as MockedSocket } from 'mock-socket'
import { ProtocolHandler } from '../ProtocolHandler'
import { BaseFakeHost, Connection, HostOptions, ConnectionId } from './BaseFakeHost'
import { enableLogger, logger } from './logger'

export class InlineFakeHost extends BaseFakeHost {
    private readonly fakeUrl!: string
    private server?: Server
    private connection?: Connection
    private client?: Client
    public Websocket = MockedSocket

    constructor(
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

    disconnect() {
        this.client?.close()
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
                close: client.close,
                write: (raw: string) => client.send(raw),
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
}
