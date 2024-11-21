import { HttpRest, HttpRestServiceOptions } from './types'
import { logger } from '../logger'
import { RestRouter } from '../types'

export class HttpRestServiceStub implements HttpRest {
    public readonly server = null
    public readonly url = Promise.resolve(new URL('http://localhost'))

    constructor(private router: RestRouter, options: Partial<HttpRestServiceOptions> = {}) {
        console.error('HttpRestService does not run in browser environment. Used stub instead.')
    }

    dispose() {
        return
    }
}
