import { HijackedRestService, enableLogger as restLogger, mockedFetch } from '@fakehost/fake-rest'
import { BrowserWsHost, enableLogger as wsLogger, Host, MockedSocket } from '@fakehost/host'
import { restRouter } from '../restHandshakeRouter'
import { isFakeSignalrHub, URL, ServerOptions } from '../types'

export { MockedSocket }

export type CreateBrowserSignalr<T extends Record<string, unknown>> = {
    dispose: () => Promise<void>
    url: URL
    disconnect: (key: keyof T) => void
    MockedSocket: BrowserWsHost['WebSocket']
    mockedFetch: typeof mockedFetch
}

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createBrowserSignalr = async <T extends Record<string, unknown>>(
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
            const hub = options.hubs[hubName]
            if (isFakeSignalrHub(hub)) {
                // BrowserWsHost uses `mock-socket` under the hood.
                // This doesn't support wildcards paths, so we need to create a new host for each hub.
                const host = new BrowserWsHost({
                    url: new URL(hub.path, wsUrl),
                    silent: options.silent,
                    name: `${options.name || 'fake'}:${hubName as string}`,
                })
                hub.setHost(host)
                acc[hubName] = {
                    disconnect: host.disconnect,
                }
            }
            return acc
        }, {} as Record<keyof T, Pick<BrowserWsHost, 'disconnect'>>)

    return {
        MockedSocket,
        mockedFetch: mockedFetch,
        url: options.url,
        disconnect: key => hosts[key].disconnect(),
        dispose: async () => {
            const wshosts = Array.from(Object.values(hosts)) as Host[]
            await Promise.all([...wshosts, httpRest.dispose()])
        },
    }
}
