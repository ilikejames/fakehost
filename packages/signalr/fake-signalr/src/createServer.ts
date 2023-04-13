import { HttpRestService, enableLogger as restLogger } from '@fakehost/fake-rest/server'
import { WsHost, Host, enableLogger as wsLogger } from '@fakehost/host'
import { URL } from 'url'
import { restRouter } from './restHandshakeRouter'

export type ServerOptions = {
    port?: number
    name?: string
    silent?: boolean
    debug?: boolean
}

type CreateServerSignalr = {
    dispose: () => Promise<void>
    url: URL
    host: Host
}

export const createServerSignalr = async (
    options?: ServerOptions,
): Promise<CreateServerSignalr> => {
    const rest = new HttpRestService(restRouter, {
        name: options?.name,
        port: options?.port,
        silent: options?.silent,
    })
    const wsHost = new WsHost({ server: rest.server, name: options?.name })

    options?.debug && wsLogger()
    options?.debug && restLogger()

    const hostUrl = await wsHost.url
    const url = new URL(`http://${hostUrl.hostname}${hostUrl.port ? ':' + hostUrl.port : ''}`)

    return {
        host: wsHost,
        url: url,
        dispose: async () => {
            await Promise.all([rest.dispose(), wsHost.dispose()])
        },
    }
}
