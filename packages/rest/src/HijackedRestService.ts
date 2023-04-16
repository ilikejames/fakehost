import fetch from 'isomorphic-fetch'
import { createRouter, isHandler } from './createRouter'
import { enableLogger, logger } from './logger'
import { Response, Request, RestRouter, Methods, HttpHeader } from './types'
import { getMethod, getRouteParams, getUrl, handleServiceError } from './utils'

export { createRouter }
export { enableLogger }

type HijackedRestServiceOptions = {
    name: string
    path: string
    silent: boolean
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
            logger(
                `${this.options.name}: For nodejs environments, please wiring up isomorphic-fetch`,
            )
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
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
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

                        const matchingRoutes = this.router.routes.filter(route => {
                            if (!route.method) {
                                // middleware
                                return route.regexp.test(url.pathname)
                            } else {
                                return route.method === method && route.regexp.test(url.pathname)
                            }
                        })

                        let status: number | undefined = undefined
                        let send: unknown[] = []
                        let complete = false
                        const headers: Headers = new Headers()
                        const response: Response = {
                            setHeader(key, value) {
                                headers.set(key, value)
                                return response
                            },
                            status: code => {
                                status = code
                                return response
                            },
                            send: data => {
                                if (complete) {
                                    throw new Error('Response already completed')
                                }
                                send.push(data)
                                complete = true
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

                        const promises: Promise<unknown>[] = []
                        const errorHandlers = [...router.errorHandlers]

                        const executeRoutes = async () => {
                            const matchingRoute = matchingRoutes.shift()

                            if (!matchingRoute || !isHandler(matchingRoute.handler))
                                return Promise.reject('failed to find route')

                            const params = getRouteParams(matchingRoute, url)
                            await matchingRoute.handler(
                                Object.assign(request, { params }),
                                response,
                                async () => {
                                    promises.push(executeRoutes())
                                },
                            )
                        }
                        promises.push(executeRoutes())
                        while (promises.length) {
                            try {
                                await promises.shift()
                            } catch (e) {
                                handleServiceError(
                                    e,
                                    errorHandlers,
                                    Object.assign(request, { params: {} }),
                                    response,
                                )
                            }
                        }

                        return Promise.resolve<Partial<globalThis.Response>>({
                            get ok() {
                                return Boolean(
                                    `${status}`.startsWith('2') || `${status}`.startsWith('3'),
                                )
                            },
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
        this.isActive = false
        logger(`${this.options.name}: Disposed.`)
    }
}

const parseInput = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
        return init?.body
    } else if (input instanceof URL) {
        return init?.body
    } else {
        return input.body
    }
}

const getBody = (input: RequestInfo | URL, init?: RequestInit) => {
    const body = parseInput(input, init)
    if (body === undefined) {
        return null
    } else if (typeof body === 'string') {
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

const getHeaders = (input: RequestInfo | URL, init?: RequestInit): HttpHeader => {
    if (typeof input === 'string') {
        return convertHeaders(init?.headers)
    } else if (input instanceof URL) {
        return convertHeaders(init?.headers)
    } else {
        return convertHeaders(input.headers)
    }
}

const convertHeaders = (headers?: HeadersInit): HttpHeader => {
    if (!headers) return {}
    if (isStringStringHeader(headers)) {
        return headers.reduce((acc, [key, value]) => {
            acc[key] = value
            return acc
        }, {} as HttpHeader)
    } else if (headers instanceof Headers) {
        return Object.fromEntries(headers.entries())
    } else {
        return headers
    }
}

const isStringStringHeader = (header: HeadersInit): header is [string, string][] => {
    return Array.isArray(header)
}
