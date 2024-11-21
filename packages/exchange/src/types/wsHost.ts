import { HostOptions } from './host'
import { ServerOptions } from 'ws'

export type WsStandaloneOptions = HostOptions & {
    port?: number
    path?: string
}

export type WsHostedOptions = HostOptions & {
    server: ServerOptions['server']
}

export type WsHostOptions = WsStandaloneOptions | WsHostedOptions
