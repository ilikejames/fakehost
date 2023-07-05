import { HttpRestService, enableLogger as restLogger } from '@fakehost/fake-rest/server'
import { WsHost, Host, enableLogger as wsLogger } from '@fakehost/exchange'
import { URL } from 'url'
import { restRouter } from './restHandshakeRouter'
import { isFakeSignalrHub } from './types'

export type ServerOptions<T extends Record<string, unknown>> = {
    port?: number
    name?: string
    silent?: boolean
    debug?: boolean
    hubs: T
}

type CreateServerSignalr<T extends object> = {
    dispose: () => Promise<void>
    url: URL
    host: Host
    disconnect: (hub: keyof T) => void
}

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createServerSignalr = async <T extends Record<string, unknown>>(
    options: ServerOptions<T>,
): Promise<CreateServerSignalr<T>> => {
    // hijack the http requests to serve the signalr handshake response
    const rest = new HttpRestService(restRouter, {
        name: `http://${options?.name}`,
        port: options?.port,
        silent: true,
    })

    const wsHost = new WsHost({
        server: rest.server,
        name: `ws://${options?.name}`,
        debug: options.debug,
    })

    const hubResult = objectKeys(options.hubs).reduce((acc, hubName) => {
        const hub = options.hubs[hubName]
        if (isFakeSignalrHub(hub)) {
            hub.setHost(wsHost)
            acc[hubName] = {
                disconnect: () => wsHost.disconnect(hub.path),
            }
        }
        return acc
    }, {} as Record<keyof T, Pick<Host, 'disconnect'>>)
    options?.debug && wsLogger()
    options?.debug && restLogger()

    const hostUrl = await wsHost.url

    const url = new URL(`http://${hostUrl.hostname}${hostUrl.port ? ':' + hostUrl.port : ''}`)

    return {
        host: wsHost,
        disconnect: (key: keyof T) => {
            return hubResult[key].disconnect()
        },
        url: url,
        dispose: async () => {
            await Promise.all([rest.dispose(), wsHost.dispose()])
        },
    }
}
