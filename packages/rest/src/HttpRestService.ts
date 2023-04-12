import { Buffer } from 'buffer'
import chalk from 'chalk'
import { createServer } from 'http'
import { AddressInfo } from 'net'
import { URL } from 'url'
import { isHandler } from './createRouter'
import { logger } from './logger'
import { RestRouter, Request, Response, Methods, HttpHeader } from './types'
import { getRouteParams, handleServiceError } from './utils'

type HttpRestServiceOptions = {
    name: string
    port: number
    path: string
    silent: boolean
}

const collect = <T>(stream: NodeJS.ReadableStream): Promise<T[]> => {
    const chunks: T[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk: T) => chunks.push(chunk))
        stream.on('end', () => resolve(chunks))
        stream.on('error', reject)
    })
}

/**
 * Really simple multipart/form-data parser, that doesn't support uploading files.
 * @param body
 * @param boundary
 * @returns
 */
const parseMultipartFormData = (body: string, boundary: string): Record<string, string> => {
    const parts = body.split(boundary).slice(1, -1)
    const parsedData: Record<string, string> = {}

    for (const part of parts) {
        const [, header, value] = part.split(/(?:\r\n)+/)
        const nameMatch = header.match(/name="([^"]+)"/)

        if (nameMatch) {
            const [, name] = nameMatch
            parsedData[name] = value
        }
    }

    return parsedData
}

const getBody = async (contentType: string, stream: NodeJS.ReadableStream) => {
    const chunks = await collect<Buffer>(stream)
    const body = Buffer.concat(chunks).toString()
    if (!body.length) {
        return null
    }
    if (contentType.includes('application/json')) {
        return JSON.parse(body)
    } else if (contentType.includes('multipart/form-data')) {
        const [, boundary] = contentType.split('boundary=')
        return parseMultipartFormData(body, boundary)
    }
    return body
}

export class HttpRestService {
    private server: ReturnType<typeof createServer>
    private options: Partial<HttpRestServiceOptions>
    public readonly url: Promise<URL>

    constructor(private router: RestRouter, options: Partial<HttpRestServiceOptions> = {}) {
        this.options = {
            name: 'http-rest-service',
            ...options,
        }

        this.server = createServer()

        this.url = new Promise((resolve, reject) => {
            this.server.on('listening', () => {
                const address = this.server.address() as AddressInfo
                const url = new URL(this.options.path ?? '/', `http://localhost:${address.port}`)
                logger(`${this.options.name}: Listening on ${url.toString()}`)
                resolve(url)
            })
            this.server.on('error', e => {
                logger('ERROR', e)
                if (!this.url) {
                    // never started successfully
                    reject(e)
                }
            })
        })

        this.server.listen(this.options.port)
        this.server.on('listening', () => {
            this.isOpen = true
            const port: number = (this.server.address() as AddressInfo).port
            !this.options.silent &&
                console.log(chalk.green(`${this.options.name}: listening on port ${port}`))
        })
        this.server.on('request', async (req, res) => {
            logger('->', req.method, req.url)
            if (!req.url) {
                logger('request does not have a url.')
                res.statusCode = 404
                res.write('Not found. Request does not have a url.')
                res.end()
                return
            }
            const requestUrl = new URL(req.url, await this.url)
            const matchingRoutes = this.router.routes.filter(route => {
                if (!route.method) {
                    // middleware
                    return route.regexp.test(requestUrl.pathname)
                } else {
                    return route.method === req.method && route.regexp.test(requestUrl.pathname)
                }
            })
            logger(
                'matching routes:',
                matchingRoutes.map(route => route.path),
            )

            const response: Response = {
                status: (code: number) => {
                    res.statusCode = code
                    return response
                },
                send: (data: bigint | string | object | Array<unknown> | number) => {
                    switch (typeof data) {
                        case 'string':
                        case 'number':
                        case 'bigint':
                            res.write(data.toString())
                            break
                        case 'object':
                            res.write(JSON.stringify(data))
                            break
                    }
                    res.end()
                    return response
                },
                json: data => {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.write(JSON.stringify(data))
                    res.end()
                    return response
                },
                end: () => {
                    res.end()
                },
            }

            const fullUrl = new URL(req.url ?? '/', `http://localhost`)
            const query = Object.fromEntries(fullUrl.searchParams.entries())
            const body = await getBody(req.headers['content-type'] ?? '', req)

            const request: Omit<Request<string>, 'params'> = {
                host: (await this.url).host,
                query: query,
                headers: req.headers as HttpHeader,
                method: req.method as Methods,
                url: req.url,
                body,
            }

            const promises: Promise<unknown>[] = []
            const errorHandlers = [...router.errorHandlers]

            const executeRoutes = async () => {
                const route = matchingRoutes.shift()
                if (!route || !isHandler(route.handler)) return
                const params = getRouteParams(route, requestUrl)
                await route.handler(Object.assign(request, { params }), response, async () => {
                    // next is called, execute next route in the list
                    await executeRoutes()
                })
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
        })

        this.server.on('upgrade', () => {
            // TODO: same as above. But verify with sockjs implementation.
        })
    }

    private isOpen = false
    dispose() {
        if (!this.isOpen) return Promise.resolve()
        return new Promise<void>((resolve, reject) => {
            this.server.close(err => {
                if (err) {
                    return reject(err)
                }
                this.isOpen = false
                resolve()
            })
        })
    }
}
