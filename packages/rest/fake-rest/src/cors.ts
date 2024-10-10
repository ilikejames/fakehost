import { Request, Response, Next } from './types'

export type CorsOptions = {
    allowHeaders?: string[]
    allowMethods?: string[]
}

export const cors =
    (options: CorsOptions = {}) =>
    (req: Request<string>, res: Response, next: Next) => {
        if (req.method !== 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Credentials', 'true')
            res.setHeader('Access-Control-Allow-Origin', `${req.headers.origin ?? '*'}`)
            return next()
        }
        res.setHeader('Access-Control-Allow-Origin', `${req.headers.origin ?? '*'}`)
        res.setHeader('Access-Control-Allow-Credentials', 'true')

        const allowHeaders = options.allowHeaders ?? [
            'Content-Type',
            'Authorization',
            ...getHeaders(req.headers['access-control-request-headers']),
        ]
        res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(', '))

        const allowMethods = options.allowMethods ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        res.setHeader('Access-Control-Allow-Methods', allowMethods.join(', '))

        res.setHeader('Access-Control-Max-Age', '86400')
        res.end()
    }

const getHeaders = (header: undefined | string | string[]) => {
    if (!header) return []
    return Array.isArray(header) ? header : header.split(',').map(x => x.trim())
}
