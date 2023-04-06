import { Handler, RestRouter, UseHandler, UseRouter, UseRouterWithPath, Route } from './types'
import { pathToRegexp, Key } from 'path-to-regexp'

type UseParameters =
    | Parameters<UseRouter>
    | Parameters<UseHandler<string>>
    | Parameters<UseRouterWithPath<string>>

export const createRouter = (): RestRouter => {
    const routes: Route[] = []

    const router: RestRouter = {
        get routes() {
            return routes
        },
        use: (...args: UseParameters) => {
            const path = typeof args[0] === 'string' ? args[0] : ''
            const childRouter = [...args].find(isRestRouter)

            if (childRouter) {
                childRouter.routes.forEach(route => {
                    const fullPath = cleanPath(`${path}/${route.path}`)
                    const keys: Key[] = []
                    const regexp = pathToRegexp(fullPath, keys)
                    routes.push({
                        handler: route.handler,
                        method: route.method,
                        path: fullPath,
                        keys,
                        regexp,
                    })
                })
            } else if (isHandler(args[0])) {
                routes.push({
                    path: null,
                    handler: args[0],
                    regexp: /.*/,
                    keys: [],
                })
            }
            return router
        },
        get: (path, handler) => {
            const keys: Key[] = []
            const regexp = pathToRegexp(path, keys)
            routes.push({
                path,
                handler: handler as Handler<string>,
                regexp,
                keys,
            })
            return router
        },
        post: () => router,
    }
    return router
}

const isRestRouter = (o: RestRouter | string | Handler<string>): o is RestRouter => {
    return typeof o !== 'string' && 'routes' in o
}

export const isHandler = (o: RestRouter | string | Handler<string>): o is Handler<string> => {
    return typeof o !== 'string' && !('routes' in o)
}

const cleanPath = (s: string) => s.replace(/\/\//g, '/')
