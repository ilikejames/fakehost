import { Connection, ConnectionId, EventMap } from './types'
import { URL } from 'url'

type HandlerMap = {
    [Key in keyof EventMap]: Set<(e: EventMap[Key]) => void>
}

export type HostOptions = {
    name: string
    debug: boolean
}

export type Host = {
    on: <Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) => void
    off: <Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) => void
    disconnect: () => void
    dispose: () => Promise<void>
    get refuseNewConnections(): boolean
    set refuseNewConnections(refuse: boolean)
    get connectionCount(): number
    get url(): Promise<URL>
}

export abstract class BaseHost implements Host {
    protected connections = new Map<ConnectionId, Connection>()
    private _refuseNewConnections = false

    protected readonly handlers: HandlerMap = {
        connection: new Set(),
        disconnection: new Set(),
        message: new Set(),
    }

    public get connectionCount() {
        return this.connections.size
    }

    public on<Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) {
        this.handlers[e].add(handler)
    }

    public off<Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) {
        this.handlers[e].delete(handler)
    }

    get refuseNewConnections(): boolean {
        return this._refuseNewConnections
    }

    set refuseNewConnections(refuse: boolean) {
        this._refuseNewConnections = refuse
    }

    abstract disconnect(): void
    abstract dispose(): Promise<void>
    abstract get url(): Promise<URL>
}
