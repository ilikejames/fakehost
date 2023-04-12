import fetch from 'isomorphic-fetch'
import { logger } from './logger'
import { Response, Request, RestRouter, Methods } from './types'
import { getHeaders, getMethod, getUrl } from './urlUtils'
import { isHandler } from './createRouter'
import { getRouteParams } from './utils'

type HijackedRestServiceOptions = {
    name: string
    path: string
}

declare global {
    // eslint-disable-next-line no-var
    var originalFetch: typeof fetch | undefined
}
/**
 * Hijacks the fetch/XmlRequest calls and returns the data from the router.
 */
export class HijackedRestService {
    private options: Partial<HijackedRestServiceOptions>
    private previousFetch: typeof fetch
    private isActive = false

    constructor(
        host: URL,
        private router: RestRouter,
        options?: Partial<HijackedRestServiceOptions>,
    ) {
        this.options = {
            name: 'HijackedRestService',
            ...options,
        }

        logger(`${this.options.name}: Starting...`)
        // wire up the fetch calls
        if (!globalThis.fetch) {
            logger(
                `${this.options.name}: No global fetch...are you sure this is a browser/dom environment?`,
            )
            logger(`${this.options.name}: Wiring up isomorphic-fetch`)
            globalThis.fetch = fetch
        }

        globalThis.originalFetch = globalThis.originalFetch || globalThis.fetch
        this.previousFetch = globalThis.fetch

        const previousFetch = (input: RequestInfo | URL, init?: RequestInit) => {
            if (this.previousFetch !== globalThis.originalFetch) {
                return this.previousFetch(input, init)
            } else {
                return globalThis.originalFetch(input, init)
            }
        }

        this.isActive = true
        globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
            if (!this.isActive) {
                return previousFetch(input, init)
            }
            const url = getUrl(input)
            logger(`${this.options.name}: Fetching ${url}`)
            if (`${host.protocol}` === url.protocol) {
                if (host.host === url.host) {
                    if (!host.pathname || url.pathname.startsWith(host.pathname)) {
                        // hijack the call
                        const method = getMethod(input, init)
                        const hostUrl = url.pathname + url.search
                        logger(`${this.options.name}:`, '->', method, hostUrl)
                        logger(`${this.options.name}:`, 'routes', this.router.routes.length)

                        const matchingRoutes = this.router.routes.filter(route => {
                            if (!route.method) {
                                // middleware
                                return route.regexp.test(url.pathname)
                            } else {
                                return route.method === method && route.regexp.test(url.pathname)
                            }
                        })

                        logger(
                            this.options.name,
                            'matching routes:',
                            matchingRoutes.map(route => route.path),
                        )

                        let status: number | undefined = undefined
                        let send: unknown[] = []
                        let complete = false
                        const headers: Headers = new Headers()
                        const response: Response = {
                            status: code => {
                                status = code
                                return response
                            },
                            send: data => {
                                if (complete) {
                                    throw new Error('Response already completed')
                                }
                                send.push(data)
                                return response
                            },
                            json: data => {
                                headers.set('Content-Type', 'application/json; charset=utf-8')
                                send = [data]
                                if (!status) {
                                    status = 200
                                }
                                complete = true
                                return response
                            },
                            end: () => {
                                if (!status) {
                                    status = 200
                                }
                                complete = true
                            },
                        }

                        const query = Object.fromEntries(url.searchParams.entries())
                        const request: Omit<Request<string>, 'params'> = {
                            host: host.host,
                            query: query,
                            headers: getHeaders(input, init) as Record<string, string>,
                            method: method as Methods,
                            url: hostUrl,
                            body: getBody(input, init),
                        }

                        const executeRoutes = () => {
                            const matchingRoute = matchingRoutes.shift()

                            if (!matchingRoute || !isHandler(matchingRoute.handler))
                                return Promise.reject('failed to find route')

                            const params = getRouteParams(matchingRoute, url)
                            matchingRoute.handler(
                                Object.assign(request, { params }),
                                response,
                                () => {
                                    executeRoutes()
                                },
                            )
                        }

                        executeRoutes()

                        return Promise.resolve<Partial<globalThis.Response>>({
                            status: status ?? 500,
                            json: () => Promise.resolve(send[0]),
                            headers: headers,
                            text: () => {
                                const result = send.map(x => {
                                    switch (typeof x) {
                                        case 'string':
                                            return x
                                        default:
                                            return JSON.stringify(x)
                                    }
                                })
                                return Promise.resolve(result.join(''))
                            },
                            url: url.toString(),
                        }) as Promise<globalThis.Response>
                    }
                }
            }
            return previousFetch(input, init)
        }
    }

    dispose() {
        // this is incorrect...
        // this will always return the original fetch
        // when what we want is to remove this handler, but keep any others
        this.isActive = false
        logger(`${this.options.name}: Disposed.`)
    }
}

const getB = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
        return init?.body
    } else if (input instanceof URL) {
        return init?.body
    } else {
        return input.body
    }
}

const getBody = (input: RequestInfo | URL, init?: RequestInit) => {
    const body = getB(input, init)
    if (typeof body === 'string') {
        return JSON.parse(body)
    } else if (body instanceof FormData) {
        const data = Object.fromEntries(body.entries())
        return data
    } else if (body instanceof Blob) {
        return body
    } else if (typeof body === 'object') {
        return body
    }
}
