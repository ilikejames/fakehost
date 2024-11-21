import { Request, Response, Next } from './types'

type TrailingSlashOptions = {
    enforceTrailingSlash?: boolean
}

export const trailingSlash = (options: TrailingSlashOptions = {}) => {
    return (req: Request<string>, _: Response, next: Next) => {
        const url = new URL(req.url, `http://${req.host}`)
        if (
            !options.enforceTrailingSlash &&
            url.pathname.slice(-1) === '/' &&
            url.pathname.length > 1
        ) {
            const query = req.url.slice(url.pathname.length)
            const safepath = url.pathname.slice(0, -1).replace(/\/+/g, '/')
            req.url = `${safepath}${query}`
            next()
        } else if (options.enforceTrailingSlash && url.pathname.slice(-1) !== '/') {
            const query = req.url.slice(url.pathname.length)
            req.url = `${url.pathname}/${query}`
            next()
        } else {
            next()
        }
    }
}
