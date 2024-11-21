import { ClientConnection } from './connection'

export const EventTypes = {
    connection: 'connection',
    disconnection: 'disconnection',
    message: 'message',
} as const

export type EventTypes = keyof typeof EventTypes

export type HandlerMap = {
    [Key in keyof EventMap]: Set<(e: EventMap[Key]) => void>
}

interface ConnectionEvent {
    type: typeof EventTypes.connection
    connection: ClientConnection
}

interface DisconnectionEvent {
    type: typeof EventTypes.disconnection
    connection: ClientConnection
}

export interface MessageEvent {
    type: typeof EventTypes.message
    connection: ClientConnection
    message: string | Buffer
}

export type EventMap = {
    [EventTypes.connection]: ConnectionEvent
    [EventTypes.disconnection]: DisconnectionEvent
    [EventTypes.message]: MessageEvent
}

export type ExchangeEvent<T extends EventTypes> = EventMap[T]
