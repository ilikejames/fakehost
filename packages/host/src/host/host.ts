import { URL } from 'url'
import { CloseOptions, Host } from '../types/host'
import { Connection, ConnectionId } from '../types/connection'
import { EventMap, HandlerMap } from '../types/events'

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

    abstract disconnect(options?: Partial<CloseOptions>): void
    abstract dispose(): Promise<void>
    abstract get url(): Promise<URL>
}

const defaultCloseOptions: CloseOptions = {
    code: 1000,
    reason: 'Service disconnected',
}

export function getCloseOptions(options?: Partial<CloseOptions>): CloseOptions {
    return {
        ...defaultCloseOptions,
        ...options,
    }
}
