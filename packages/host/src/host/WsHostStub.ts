import { Host } from '../types/host'
import { WsHostOptions } from '../types/wsHost'
import { BaseHost } from './host'
import { logger } from './logger'

/**
 * Stub host for when loaded in browser rather than run as service
 */
export class WsHostStub extends BaseHost implements Host {
    public readonly port: Promise<number>
    public readonly url: Promise<URL>

    constructor(options?: Partial<WsHostOptions>) {
        super()
        logger('WsHost disabled in browser')
        this.port = new Promise(resolve => resolve(0))
        this.url = new Promise(resolve => resolve(new URL('http://localhost')))
    }

    disconnect(): void {}

    dispose(): Promise<void> {
        return Promise.resolve<void>(void 0)
    }
}
