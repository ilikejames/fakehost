import { RestRouter } from '../types'
import { HttpRestServiceOptions, HttpRest } from './types'
import { logger } from '../logger'

export class HttpRestServiceStub implements HttpRest {
    public readonly server = null
    public readonly url = Promise.resolve(new URL('http://localhost'))

    constructor(private router: RestRouter, options: Partial<HttpRestServiceOptions> = {}) {
        logger('HttpRestService does not run in browser environment')
    }

    dispose() {}
}
