/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export type Connection = {
    readonly id: string
    close: () => void
    write: (message: string) => void
    isClosed?: boolean
    query?: Record<string, string | string[] | undefined>
}

/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export interface HostOptions {
    name?: string
    debug?: boolean
}

/**
 * @deprecated The method is deprecated and will be removed in the next major version.
 * See https://ilikejames.github.io/fakehost/#/migrating-from-v0-to-v1 for more information.
 */
export interface FakeHost {
    readonly url: Promise<string>
    dispose: () => Promise<void>
    disconnect: () => void
    getConnections: () => Connection[]
    start: (port?: number) => void
    refuseNewConnections: boolean
}

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
