import { createServer } from 'http'
import { RestRouter, Request, Response, Methods } from './types'
import { URL } from 'url'
import { AddressInfo } from 'net'
import { logger } from './logger'
import { isHandler } from './createRouter'

type HttpRestServiceOptions = {
    name: string
    port: number
    path: string
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
        this.server.on('request', (req, res) => {
            logger('->', req.method, req.url)
            if (!req.url) {
                logger('request does not have a url.')
                res.statusCode = 404
                res.write('Not found. Request does not have a url.')
                res.end()
                return
            }
            const matchingRoutes = this.router.routes.filter(route => {
                if (!route.method) {
                    // middleware
                    return route.regexp.test(req.url!)
                } else {
                    return route.method === req.method && route.regexp.test(req.url!)
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
                            logger('sending json', 'with header')
                            res.setHeader('Content-Type', 'application/json; charset=utf-8')
                            res.write(JSON.stringify(data))
                            break
                    }
                    return response
                },
                end: () => {
                    res.end()
                },
            }
            // while(matchingRoutes.length) {
            const route = matchingRoutes.shift()!
            const paramValues = route.regexp.exec(req.url!)
            const params = route.keys.reduce((acc, key, i) => {
                acc[key.name] = paramValues![i + 1]
                return acc
            }, {} as Record<string, string>)

            const fullUrl = new URL(req.url!, `http://localhost`)
            const query = Object.fromEntries(fullUrl.searchParams.entries())
            const request: Request<string> = {
                params: params,
                query: query,
                headers: req.headers as Record<string, string>, // TODO: string | undefined | string[]
                method: req.method! as Methods,
                url: req.url!,
            }

            const { handler } = route
            if (isHandler(handler)) {
                handler(request, response, () => undefined)
                return
            }
            // }
        })
        this.server.on('upgrade', (req, socket, head) => {
            // same as above. But check sockjs implementation.
        })
    }

    dispose() {
        return new Promise<void>((resolve, reject) => {
            this.server.close(err => {
                if (err) {
                    return reject(err)
                }
                resolve()
            })
        })
    }
}

// fake rest service.
// create server and listen on port
//
// needs routing:
//    server.get('/api/endpoint', (req, res) => {})
//    server.post('/api/endpoint', (req, res) => {})
//    server.get('/api/:username', (req, res) => {}) // gets username
//    server.get('/api?username=:username', (req, res) => {}) // gets username from params
//    server.use((req, res, next) => {}) // middleware on all routes
//
// res:
//    res.status(200).send({ data: 'some data' }).end()
