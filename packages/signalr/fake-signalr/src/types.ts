import Url from 'url'
import { FakeSignalrHub } from './FakeSignalrHub'

export type ServerOptions<T extends Record<string, unknown>> = {
    url: URL
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: T
}

export type Signalr<T> = T extends FakeSignalrHub<infer H, infer R, infer S>
    ? FakeSignalrHub<H, R, S>
    : never

export type SignalrHubCollection<T> = {
    readonly [Key in keyof T]: Signalr<T[Key]>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFakeSignalrHub = (hub: any): hub is FakeSignalrHub<any, any, any> => {
    // HACK: sDue to how cypress runs in different processes, have to perform this super hack
    return (
        'constructor' in hub &&
        'name' in hub.constructor &&
        hub.constructor.name === 'FakeSignalrHub'
    )
}

export const URL = globalThis.URL || Url.URL
