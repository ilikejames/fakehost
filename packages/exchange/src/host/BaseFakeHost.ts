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

type EventType = 'connection' | 'disconnect'

type EventHandler = (r: { event: EventType; id: string }) => void

export interface FakeHost {
    readonly url: Promise<string>
    dispose: () => Promise<void>
    disconnect: () => void
    getConnections: () => Connection[]
    start: (port?: number) => void
    refuseNewConnections: boolean
    addEventListener: (event: EventType, handler: EventHandler) => void
    removeEventListener: (event: EventType, handler: EventHandler) => void
}

export abstract class BaseFakeHost<I, O> implements FakeHost {
    private readonly _connections = new Array<Connection>()
    private eventHandlers = new Array<{ event: EventType; handler: EventHandler }>()

    constructor(public readonly protocolHandler: ProtocolHandler<I, O>) {}

    protected onConnection(connection: Connection) {
        this._connections.unshift({
            ...connection,
            isClosed: false,
        })
        if (this.protocolHandler.onConnection != null) {
            this.protocolHandler.onConnection(connection)
        }
        this.eventHandlers
            .filter(x => x.event === 'connection')
            .forEach(({ handler }) =>
                handler({
                    event: 'connection',
                    id: connection.id,
                }),
            )
    }

    public addEventListener(event: EventType, handler: EventHandler) {
        this.eventHandlers.push({ event, handler })
    }

    public removeEventListener(event: EventType, handler: EventHandler) {
        this.eventHandlers = this.eventHandlers.filter(
            x => !(x.event === event && x.handler === handler),
        )
    }

    public getConnections() {
        return this._connections
    }

    refuseNewConnections = false

    abstract get url(): Promise<string>

    abstract dispose(): Promise<void>

    protected onClose(id: string) {
        const listeners = this.eventHandlers.filter(x => x.event === 'disconnect')
        this._connections.forEach(x => {
            if (x.id === id) {
                x.isClosed = true
                listeners.forEach(({ handler }) =>
                    handler({
                        event: 'disconnect',
                        id,
                    }),
                )
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
