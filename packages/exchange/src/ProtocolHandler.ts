import { Connection } from './host/BaseFakeHost'

export interface ProtocolHandler<I = object, O = unknown> {
    path?: string
    serialize: (message: O) => string
    deserialize: (message: string | Buffer) => I
    onConnection?: (connection: Connection) => void
    onDisconnection?: (connection: Connection) => void
    onMessage: (connection: Connection, message: I) => void
}

export interface ServiceDefinition<T> {
    destination: T
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (...args: any[]) => any
}
