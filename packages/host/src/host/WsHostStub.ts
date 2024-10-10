import { Host } from '../types/host'
import { BaseHost } from './host'
import { logger } from './logger'

/**
 * Stub host for when loaded in browser rather than run as service
 */
export class WsHostStub extends BaseHost implements Host {
    public readonly port: Promise<number>
    public readonly url: Promise<URL>

    constructor() {
        super()
        logger('WsHost disabled in browser')
        this.port = new Promise(resolve => resolve(0))
        this.url = new Promise(resolve => resolve(new URL('http://localhost')))
    }

    disconnect(): void {
        return
    }

    dispose(): Promise<void> {
        return Promise.resolve<void>(void 0)
    }
}
