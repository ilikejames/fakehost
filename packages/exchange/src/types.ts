import { URL } from 'url'

export type ConnectionId = string & { __connectionId: never }

export type CloseConnectionOptions = {
    code: number
    reason: string
}

export interface Connection {
    url: URL
    close: (options?: CloseConnectionOptions) => void
    readonly id: ConnectionId
    write: (message: string | Buffer) => void
    isClosed?: boolean
}

export type EventTypes = 'connection' | 'disconnection' | 'message'

interface ConnectionEvent {
    type: 'connection'
    connection: Connection
}

interface DisconnectionEvent {
    type: 'disconnection'
    connection: Connection
}

export interface MessageEvent {
    type: 'message'
    connection: Connection
    message: string | Buffer
}

export type EventMap = {
    connection: ConnectionEvent
    disconnection: DisconnectionEvent
    message: MessageEvent
}

export type ExchangeEvent<T extends EventTypes> = EventMap[T]
