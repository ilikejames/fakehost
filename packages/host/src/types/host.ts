import { CloseConnectionOptions } from './connection'
import { EventMap } from './events'
import { URL } from 'url'

export type HostOptions = {
    name: string
    debug: boolean
    silent: boolean
}

export type CloseOptions = CloseConnectionOptions & {
    path?: string
}

export type Host = {
    on: <Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) => void
    off: <Key extends keyof EventMap>(e: Key, handler: (e: EventMap[Key]) => void) => void
    disconnect: (options?: Partial<CloseOptions>) => void
    dispose: () => Promise<void>
    refuseNewConnections: boolean
    readonly connectionCount: number
    readonly url: Promise<URL>
}
