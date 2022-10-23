import chalk from 'chalk'
import { AddressInfo } from 'net'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import { ProtocolHandler } from '../ProtocolHandler'
import { BaseFakeHost, Connection, HostOptions } from './BaseFakeHost'
import { enableLogger, logger } from './logger'

export class WsFakeHost<I, O> extends BaseFakeHost<I, O> {
    private websocket!: WebSocket.Server
    private serverPort?: number
    private readonly connections = new Map<string, WebSocket>()

    constructor(
        protocolHandler: ProtocolHandler<I, O>,
        port?: number,
        private readonly path: string = '/json',
        private readonly options: HostOptions = { name: 'WsFakeHost' },
    ) {
        super(protocolHandler)
        this.start(port)
        options.debug && enableLogger()
    }

    public start(port = 0) {
        if (this.websocket) {
            logger(`${this.options.name}: WARNING already running.`)
            return
        }

        this.websocket = new WebSocket.Server({
            port,
            path: this.path,
        })

        this.websocket.on('listening', () => {
            const address = this.websocket.address() as AddressInfo
            this.serverPort = address.port
            console.log(chalk.green(`${this.options.name}: Started on ${address.port}`))
        })

        this.websocket.on('connection', socket => {
            if (this.refuseNewConnections) {
                logger(`${this.options.name}: Refusing new connection`)
                socket.close()
                return
            }

            const id = uuid()
            this.connections.set(id, socket)

            const connection: Connection = {
                id,
                close: () => {
                    socket.close()
                },
                write: (raw: string) => {
                    socket.send(raw)
                },
            }

            this.onConnection(connection)

            socket.on('message', (raw: string | Buffer) => {
                this.onMessage(connection, raw)
            })

            socket.on('close', () => {
                this.onClose(id)
                this.connections.delete(id)
                super.onClose(id)
            })
        })
    }

    get url(): Promise<string> {
        return this.port.then(port => {
            return `http://127.0.0.1:${port}${this.path}`
        })
    }

    private get port(): Promise<number> {
        // When the port is set with 0, it will startup on a free port
        // We only get this port once the service has started.
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                if (this.serverPort) {
                    clearInterval(intervalId)
                    resolve(this.serverPort)
                }
            }, 1)
        })
    }

    async dispose(): Promise<void> {
        this.disconnect()
        return new Promise((resolve, reject) => {
            this.websocket.close(err => {
                logger(chalk.red(`${this.options.name}: Disposed.`))
                return err ? reject(err.message) : resolve()
            })
        })
    }

    disconnect() {
        logger(chalk.yellow(`${this.options.name}: Disconnecting clients.`))
        this.connections.forEach(connection => {
            connection.close()
        })
    }
}
