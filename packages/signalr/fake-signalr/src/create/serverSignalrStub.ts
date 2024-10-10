import { ServerOptions } from '../types'
import { WsHost } from '@fakehost/host'
import { ServerSignalr } from './types'
import { logger } from './logger'

export const createServerSignalrStub = async <T extends Record<string, unknown>>(
    options: ServerOptions<T>,
): Promise<ServerSignalr<T>> => {
    logger('createServerSignalrStub does not run in browser environment')

    const wsHost = new WsHost({
        name: `ws://${options?.name}`,
        debug: options.debug,
    })
    return {
        disconnect: () => void 0,
        dispose: async () => void 0,
        host: wsHost,
        url: options.url,
    }
}
