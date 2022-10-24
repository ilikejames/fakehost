import { ProtocolHandler } from '../ProtocolHandler'

export interface HostOptions {
    name?: string
    debug?: boolean
}
export interface Connection {
    close: () => void
    readonly id: string
    write: (message: string) => void
    isClosed?: boolean
    query?: Record<string, string | string[] | undefined>
}
export interface FakeHost {
    readonly url: Promise<string>
    dispose: () => Promise<void>
    disconnect: () => void
    getConnections: () => Connection[]
    start: (port?: number) => void
    refuseNewConnections: boolean
}

export abstract class BaseFakeHost implements FakeHost {
    private readonly _connections = new Array<Connection>()

    constructor(public readonly protocolHandler: ProtocolHandler<any, any>) {}

    protected onConnection(connection: Connection) {
        this._connections.unshift({
            ...connection,
            isClosed: false,
        })
        if (this.protocolHandler.onConnection != null) {
            this.protocolHandler.onConnection(connection)
        }
    }

    public getConnections() {
        return this._connections
    }

    refuseNewConnections = false

    abstract get url(): Promise<string>

    abstract dispose(): Promise<void>

    protected onClose(id: string) {
        this._connections.forEach(x => {
            if (x.id === id) {
                x.isClosed = true
                this.protocolHandler.onDisconnection && this.protocolHandler.onDisconnection(x)
            }
        })
    }

    abstract disconnect(): void

    abstract start(): void

    protected onMessage(connection: Connection, raw: string | Buffer) {
        const message = this.protocolHandler.deserialize(raw)
        this.protocolHandler.onMessage(connection, message)
    }
}
