import { Connection } from './host/BaseFakeHost'

export interface ProtocolHandler<I extends {}, O> {
    serialize: (message: O) => string
    deserialize: (message: string | Buffer) => I
    onConnection?: (connection: Connection) => void
    onDisconnection?: (connection: Connection) => void
    onMessage: (connection: Connection, message: I) => void
    subscribe: (definition: ServiceDefinition<Partial<I>>) => void
}
export interface ServiceDefinition<T> {
    destination: T
    handler: (params: unknown) => unknown
}
