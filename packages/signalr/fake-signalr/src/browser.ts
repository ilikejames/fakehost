import {
    HijackedRestService,
    enableLogger as restLogger,
    mockedFetch,
} from '@fakehost/fake-rest/browser'
import { BrowserWsHost, enableLogger as wsLogger, Host, MockedSocket } from '@fakehost/exchange'
import { restRouter } from './restHandshakeRouter'
import { isFakeSignalrHub, URL, Signalr } from './types'

export { MockedSocket }

export type ServerOptions<T> = {
    url: URL
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: {
        readonly [Key in keyof T]: Signalr<T[Key]>
    }
}

export type CreateBrowserSignalr<T> = {
    dispose: () => Promise<void>
    url: URL
    hubs: { readonly [K in keyof T]: Pick<BrowserWsHost, 'disconnect'> }
    MockedSocket: BrowserWsHost['WebSocket']
    mockedFetch: typeof mockedFetch
}

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createInBrowserSignalr = async <T extends object>(
    options: ServerOptions<T>,
): Promise<CreateBrowserSignalr<T>> => {
    if (options.debug) {
        restLogger()
        wsLogger()
    }

    // hijack the http requests to server the handshake response
    const httpRest = new HijackedRestService(options.url, restRouter, {
        name: options.name,
        silent: false,
    })

    // signalr client lib requires the endpoint protocol to be ws://
    const wsUrl = new URL(options.url)
    wsUrl.protocol = 'ws:'

    const hosts = objectKeys(options.hubs)
        .filter(hubName => isFakeSignalrHub(options.hubs[hubName]))
        .reduce((acc, hubName) => {
            // BrowserWsHost uses `mock-socket` under the hood.
            // This doesn't support wildcards paths, so we need to create a new host for each hub.
            const host = new BrowserWsHost({
                url: new URL(options.hubs[hubName].path, wsUrl),
                silent: options.silent,
                name: `${options.name || 'fake'}:${hubName as string}`,
            })
            options.hubs[hubName].setHost(host)
            acc[hubName] = {
                disconnect: host.disconnect,
            }
            return acc
        }, {} as Record<keyof T, Pick<BrowserWsHost, 'disconnect'>>)

    return {
        hubs: hosts,
        MockedSocket,
        mockedFetch: mockedFetch,
        url: options.url,
        dispose: async () => {
            const wshosts = Array.from(Object.values(hosts)) as Host[]
            await Promise.all([...wshosts, httpRest.dispose()])
        },
    }
}
