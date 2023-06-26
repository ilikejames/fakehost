import { Connection } from '../types'
/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export interface ProtocolHandler<I = object, O = unknown> {
    path?: string
    serialize: (message: O) => string
    deserialize: (message: string | Buffer) => I
    onConnection?: (connection: Connection) => void
    onDisconnection?: (connection: Connection) => void
    onMessage: (connection: Connection, message: I) => void
}

/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export interface ServiceDefinition<T> {
    destination: T
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (...args: any[]) => any
}
