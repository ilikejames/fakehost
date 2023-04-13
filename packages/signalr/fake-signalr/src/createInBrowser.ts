import { HijackedRestService, enableLogger as restLogger } from '@fakehost/fake-rest/browser'
import { BrowserWsHost, Host, enableLogger as wsLogger } from '@fakehost/host'
import { URL } from 'url'
import { restRouter } from './restHandshakeRouter'

export type ServerOptions = {
    url: URL
    name?: string
    silent?: boolean
    debug?: boolean
}

type CreateInBrowserSignalr = {
    dispose: () => Promise<void>
    url: URL
    host: Host
}

export const createInBrowserSignalr = async (
    options: ServerOptions,
): Promise<CreateInBrowserSignalr> => {
    const rest = new HijackedRestService(options.url, restRouter, {
        name: options?.name,
        silent: options?.silent,
    })

    const wsHost = new BrowserWsHost({ url: options.url, name: options?.name })

    options?.debug && wsLogger()
    options?.debug && restLogger()

    const url = await wsHost.url

    return {
        host: wsHost,
        url: url,
        dispose: async () => {
            await Promise.all([rest.dispose(), wsHost.dispose()])
        },
    }
}
