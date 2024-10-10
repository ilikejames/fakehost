import { HttpRest } from './types'
import { logger } from '../logger'

export class HttpRestServiceStub implements HttpRest {
    public readonly server = null
    public readonly url = Promise.resolve(new URL('http://localhost'))

    constructor() {
        logger('HttpRestService does not run in browser environment')
    }

    dispose() {
        return
    }
}
