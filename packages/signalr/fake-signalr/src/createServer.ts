import { HttpRestService, enableLogger as restLogger } from '@fakehost/fake-rest/server'
import { WsHost, Host, enableLogger as wsLogger } from '@fakehost/host'
import { URL } from 'url'
import { FakeSignalrHub } from './FakeSignalrHub'
import { restRouter } from './restHandshakeRouter'

type Signalr<T> = T extends FakeSignalrHub<infer H, infer R, infer S>
    ? FakeSignalrHub<H, R, S>
    : never

export type ServerOptions<T> = {
    port?: number
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: {
        readonly [Key in keyof T]: Signalr<T[Key]>
    }
}

type CreateServerSignalr<T> = {
    dispose: () => Promise<void>
    url: URL
    host: Host
    hubs: { readonly [K in keyof T]: Pick<Host, 'disconnect'> }
}

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createServerSignalr = async <T extends object>(
    options: ServerOptions<T>,
): Promise<CreateServerSignalr<T>> => {
    // hijack the http requests to serve the signalr handshake response
    const rest = new HttpRestService(restRouter, {
        name: options?.name,
        port: options?.port,
        silent: options?.silent,
    })

    const wsHost = new WsHost({
        server: rest.server,
        name: options?.name,
        debug: options.debug,
    })

    const hubResult = objectKeys(options.hubs).reduce((acc, hubName) => {
        const hub = options.hubs[hubName]
        hub.setHost(wsHost)
        acc[hubName] = {
            disconnect: () => wsHost.disconnect(hub.path),
        }
        return acc
    }, {} as Record<keyof T, Pick<Host, 'disconnect'>>)
    options?.debug && wsLogger()
    options?.debug && restLogger()

    const hostUrl = await wsHost.url
    const url = new URL(`http://${hostUrl.hostname}${hostUrl.port ? ':' + hostUrl.port : ''}`)

    return {
        host: wsHost,
        hubs: hubResult,
        url: url,
        dispose: async () => {
            await Promise.all([rest.dispose(), wsHost.dispose()])
        },
    }
}
