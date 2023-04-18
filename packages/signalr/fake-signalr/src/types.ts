import Url from 'url'
import { FakeSignalrHub } from './FakeSignalrHub'

export type Signalr<T> = T extends FakeSignalrHub<infer H, infer R, infer S>
    ? FakeSignalrHub<H, R, S>
    : never

export type SignalrHubCollection<T> = {
    readonly [Key in keyof T]: Signalr<T[Key]>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFakeSignalrHub = (hub: any): hub is FakeSignalrHub<any, any, any> => {
    // TODO: instanceof is not working, for reasons... so just use path for now
    return 'path' in hub
}

export const URL = globalThis.URL || Url.URL
