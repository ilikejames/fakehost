import { HijackedRestService, enableLogger as restLogger } from '@fakehost/fake-rest/browser'
import { BrowserWsHost, enableLogger as wsLogger } from '@fakehost/host'
import Url from 'url'
import { restRouter } from './restHandshakeRouter'
import { FakeSignalrHub } from './FakeSignalrHub'

const URL = globalThis.URL || Url.URL

export type ServerOptions = {
    url: URL
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: ReadonlyArray<FakeSignalrHub<any, any, any>>
}

type CreateInBrowserSignalr = {
    dispose: () => Promise<void>
    url: URL
}

export const createInBrowserSignalr = async (
    options: ServerOptions,
): Promise<CreateInBrowserSignalr> => {
    const rest = new HijackedRestService(options.url, restRouter, {
        name: options?.name,
        silent: options?.silent,
    })

    const remoteUrl = new URL(options.url)
    remoteUrl.protocol = 'ws:'

    const wsHosts = options.hubs.map(hub => {
        const host = new BrowserWsHost({
            url: new URL(hub.path, remoteUrl),
            name: `${options?.name ?? 'hub'}/${hub.path}`,
        })
        hub.setHost(host)
        return host
    })

    options?.debug && wsLogger()
    options?.debug && restLogger()

    return {
        url: options.url,
        dispose: async () => {
            await Promise.all([rest.dispose(), ...wsHosts.map(x => x.dispose())])
        },
    }
}
