import { Connection } from './connection'

export type EventTypes = 'connection' | 'disconnection' | 'message'

export type HandlerMap = {
    [Key in keyof EventMap]: Set<(e: EventMap[Key]) => void>
}

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
