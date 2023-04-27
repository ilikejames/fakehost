import { createRouter, isHandler } from './createRouter'
import { enableLogger, logger } from './logger'
import { type Methods } from './methods'
import { Response, Request, RestRouter, HttpHeader } from './types'
import { getMethod, getRouteParams, getUrl, handleServiceError } from './utils'
import { FetchCollection } from './FetchCollection'

export { createRouter }
export { enableLogger }

type HijackedRestServiceOptions = {
    name: string
    path: string
    silent: boolean
}

export const mockedFetch = (...args: Parameters<typeof fetch>) => {
    return FetchCollection.getInstance().instance(...args)
}

/**
 * Hijacks the fetch/XmlRequest calls and returns the data from the router.
 */
export class HijackedRestService {
    private options: Partial<HijackedRestServiceOptions>
    private isActive = true
    private readonly hijackedFetch: typeof fetch

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

        this.hijackedFetch = globalThis.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit,
        ) => {
            if (!this.isActive) {
                return FetchCollection.getInstance().next(this.hijackedFetch)(input, init)
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
                            json: () => {
                                if (request.method === 'HEAD') {
                                    return Promise.reject(
                                        new SyntaxError('Unexpected end of JSON input'),
                                    )
                                }
                                return Promise.resolve(send[0])
                            },
                            headers: headers,
                            text: () => {
                                if (request.method === 'HEAD') {
                                    return Promise.resolve('')
                                }
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
            return FetchCollection.getInstance().next(this.hijackedFetch)(input, init)
        }

        FetchCollection.getInstance().push(this.hijackedFetch)
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

const compareInstance = (
    body: any,
    klass: { new (): FormData } | { new (): URLSearchParams } | { new (): Blob },
) => {
    if (body instanceof klass) return true
    // In cypress we are comparing across different window instances.
    return 'constructor' in body && body.constructor.toString() === klass.toString()
}

const isURLSearchParams = (body: any): body is URLSearchParams =>
    compareInstance(body, URLSearchParams)

const isFormData = (body: any): body is FormData => compareInstance(body, FormData)

const isBlob = (body: any): body is Blob => compareInstance(body, Blob)

const getBody = (input: RequestInfo | URL, init?: RequestInit) => {
    const body = parseInput(input, init)
    if (body === undefined || body === null) {
        return null
    } else if (typeof body === 'string') {
        return JSON.parse(body)
    } else if (isFormData(body)) {
        return Object.fromEntries(body.entries())
    } else if (isURLSearchParams(body)) {
        return Object.fromEntries((body as unknown as URLSearchParams).entries())
    } else if (isBlob(body)) {
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
