import { HttpRestService, enableLogger as restLogger } from '@fakehost/fake-rest'
import { CloseConnectionOptions, WsHost, Host, enableLogger as wsLogger } from '@fakehost/host'
import { URL } from 'url'
import { restRouter } from '../restHandshakeRouter'
import { isFakeSignalrHub, ServerOptions } from '../types'
import { ServerSignalr } from './types'

const objectKeys = <T extends Record<string, unknown>>(x: T) => Object.keys(x) as (keyof T)[]

export const createServerSignalr = async <T extends Record<string, unknown>>(
    options: ServerOptions<T>,
): Promise<ServerSignalr<T>> => {
    // hijack the http requests to serve the signalr handshake response
    const rest = new HttpRestService(restRouter, {
        name: `http://${options?.name}`,
        port: options?.url.port ? parseInt(options?.url.port) : 0,
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
                disconnect: () => wsHost.disconnect({ path: hub.path }),
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
        disconnect: (hub: keyof T, options?: CloseConnectionOptions) => {
            return hubResult[hub].disconnect(options)
        },
        url: url,
        dispose: async () => {
            await Promise.all([rest.dispose(), wsHost.dispose()])
        },
    }
}
