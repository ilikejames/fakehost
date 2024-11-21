import { WsHost } from '../host/WsHost'
import { ConnectionId, ClientConnection as NewConnection } from '../types/connection'
import { CloseOptions } from '../types/host'
import { Connection, FakeHost, HostOptions, ProtocolHandler } from './types'

/**
 * @deprecated The class is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export class WsFakeHost implements FakeHost {
    private server: WsHost
    private connections = new Map<ConnectionId, Connection>()

    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protocolHandler: ProtocolHandler<any, any>,
        port?: number,
        path = '/json',
        options: HostOptions = { name: 'WsFakeHost' },
    ) {
        this.server = new WsHost({
            debug: options.debug,
            name: options.name ?? 'WsFakeHost',
            path,
            port,
        })
        this.server.on('connection', ({ connection }) => {
            this.connections.set(connection.id, this.getLegacyConnection(connection))
            protocolHandler.onConnection?.(this.getLegacyConnection(connection))
        })
        this.server.on('disconnection', ({ connection }) => {
            this.connections.delete(connection.id)
            protocolHandler.onDisconnection?.(this.getLegacyConnection(connection))
        })
        this.server.on('message', ({ connection, message: raw }) => {
            const message = protocolHandler.deserialize(raw)
            protocolHandler.onMessage?.(this.getLegacyConnection(connection), message)
        })
    }

    private getLegacyConnection(connection: NewConnection): Connection {
        return {
            id: connection.id,
            close: () => this.disconnect(),
            write: (message: string) => connection.write(message),
        }
    }

    get refuseNewConnections() {
        return this.server.refuseNewConnections ?? false
    }

    set refuseNewConnections(value: boolean) {
        this.server.refuseNewConnections = value
    }

    get url(): Promise<string> {
        return this.server.url.then(url => url.href)
    }

    start() {
        // noop
    }

    getConnections() {
        return Array.from(this.connections.values())
    }

    async dispose(): Promise<void> {
        return this.server?.dispose()
    }

    disconnect(options?: Partial<CloseOptions>) {
        return this.server?.disconnect(options)
    }
}
