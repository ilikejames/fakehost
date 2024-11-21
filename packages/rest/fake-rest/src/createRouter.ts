import { pathToRegexp } from 'path-to-regexp'
import { type Methods } from './methods'
import {
    RestHandler,
    RestRouter,
    UseHandler,
    UseRouter,
    UseRouterWithPath,
    Route,
    ErrorHandler,
} from './types'

type UseParameters =
    | Parameters<UseRouter>
    | Parameters<UseHandler<string>>
    | Parameters<UseRouterWithPath<string>>

export const createRouter = (): RestRouter => {
    const routes: Route[] = []
    const errorHandlers: ErrorHandler[] = []

    const router: RestRouter = {
        get routes() {
            return routes
        },
        get errorHandlers() {
            return errorHandlers
        },
        useError: (handler: ErrorHandler) => {
            errorHandlers.push(handler)
            return router
        },
        use: (...args: UseParameters) => {
            const path = typeof args[0] === 'string' ? args[0] : ''
            const childRouter = [...args].find(isRestRouter)

            if (childRouter) {
                childRouter.routes.forEach(route => {
                    const fullPath = cleanPath(`${path}/${route.path}`)
                    const { regexp, keys } = pathToRegexp(fullPath)
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
        METHOD: (method, path, handler) => {
            const { regexp, keys } = pathToRegexp(path)
            routes.push({
                method: method.toUpperCase() as Methods,
                path,
                handler: handler as RestHandler<string>,
                regexp,
                keys,
            })
            return router
        },
        delete: (path, handler) => router.METHOD('DELETE', path, handler),
        get: (path, handler) => router.METHOD('GET', path, handler),
        head: (path, handler) => router.METHOD('HEAD', path, handler),
        patch: (path, handler) => router.METHOD('PATCH', path, handler),
        post: (path, handler) => router.METHOD('POST', path, handler),
        put: (path, handler) => router.METHOD('PUT', path, handler),
        options: (path, handler) => router.METHOD('OPTIONS', path, handler),
    }
    return router
}

const isRestRouter = (o: RestRouter | string | RestHandler<string>): o is RestRouter => {
    return typeof o !== 'string' && 'routes' in o
}

export const isHandler = (
    o: RestRouter | string | RestHandler<string>,
): o is RestHandler<string> => {
    return typeof o !== 'string' && !('routes' in o)
}

const cleanPath = (s: string) => {
    // remove double slashes
    let result = s.replace(/\/\//g, '/')

    // remove trailing slash
    if (result.endsWith('/')) {
        result = result.slice(0, -1)
    }
    return result
}
