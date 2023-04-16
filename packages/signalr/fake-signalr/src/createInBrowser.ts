import { HijackedRestService, enableLogger as restLogger } from '@fakehost/fake-rest/browser'
import { BrowserWsHost, enableLogger as wsLogger, Host } from '@fakehost/host'
import Url from 'url'
import { restRouter } from './restHandshakeRouter'
import { SignalrHubCollection, isFakeSignalrHub } from './types'

const URL = globalThis.URL || Url.URL

export type ServerOptions<T> = {
    url: URL
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: SignalrHubCollection<T>
}

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createInBrowserSignalr = async <T extends object>(options: ServerOptions<T>) => {
    if (options.debug) {
        restLogger()
        wsLogger()
    }

    // hijack the http requests to server the handshake response
    const httpRest = new HijackedRestService(options.url, restRouter, {
        name: options.name,
        silent: false,
    })

    // signalr client lib requires the endpoint protocol to be ws:/
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
                disconnect: () => host.disconnect(),
            }
            return acc
        }, {} as Record<keyof T, Pick<Host, 'disconnect'>>)

    return {
        hosts,
        url: options.url,
        dispose: async () => {
            const wshosts = Array.from(Object.values(hosts)) as Host[]
            await Promise.all([...wshosts, httpRest.dispose()])
        },
    }
}
