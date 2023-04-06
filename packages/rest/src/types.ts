import { Key } from 'path-to-regexp'

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type Request<T extends string> = {
    method: Methods
    url: string
    query: ExtractQueryParams<RemoveParentheses<T>>
    params: ExtractRouteParams<RemoveParentheses<T>>
    headers: Record<string, string>
}

export type Response = {
    status: (code: number) => Response
    send: (data: object | string | number | unknown[]) => Response
    end: () => void
}

export type Next = () => void

export type Handler<T extends string> = (req: Request<T>, res: Response, next: Next) => void

// type ExtractRouteParams<T> = T extends `${string}/:${infer Param}?/${infer Rest}`
//     ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string | undefined }
//     : T extends `${string}/:${infer Param}?`
//     ? { [K in Param]: string | undefined }
//     : T extends `${string}/:${infer Param}/${infer Rest}`
//     ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
//     : T extends `${string}/:${infer Param}`
//     ? { [K in Param]: string }
//     : {}

// type ExtractRouteParams<T> = T extends `${string}/:${infer Param}/${infer Rest}`
//     ? { [K in RemoveParentheses<Param>]: string } & ExtractRouteParams<`/${Rest}`>
//     : T extends `${string}/:${infer Param}`
//     ? { [K in RemoveParentheses<Param>]: string }
//     : {}

type ExtractRouteParams<T> = T extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : T extends `${string}/:${infer Param}`
    ? { [K in Param]: string }
    : {}

type RemoveParentheses<T extends string> = T extends `${infer Before}\(${infer _}\)${infer After}`
    ? `${Before}${After}`
    : T

type ExtractQueryParams<T extends string> = string extends T
    ? Record<string, string>
    : T extends `${string}?${infer U}`
    ? U extends `${infer Query}&${infer Rest}`
        ? Record<
              Query extends `${infer Key}=${infer Value}` ? Key : never,
              Query extends `${infer Key}=${infer Value}` ? Value : never
          > &
              ExtractQueryParams<`?${Rest}`>
        : U extends `${infer Query}`
        ? Record<
              Query extends `${infer Key}=${infer Value}` ? Key : never,
              Query extends `${infer Key}=${infer Value}` ? Value : never
          >
        : {}
    : {}

export type UseHandler<T extends string> = (handler: Handler<T>) => RestRouter
export type UseRouterWithPath<T extends string> = (path: T, router: RestRouter) => RestRouter
export type UseRouter = (router: RestRouter) => RestRouter

export type Route = {
    method?: Methods
    path: string | null
    handler: Handler<string> | RestRouter
    regexp: RegExp
    keys: Key[]
}

export type RestRouter = {
    get routes(): Route[]
    use: UseHandler<string> & UseRouter & UseRouterWithPath<string>
    get: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    post: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
}

// const server = createServer()
// server.get('/api/:username/:action', (req, res) => {
//     console.log('username =', req.params.username)
//     console.log('action =', req.params.action)
//     ;(req.query as any).something
// })
// server.get('/api?param=:param&username=:username', (req, res) => {
//     console.log('username =', req.query.username)
//     console.log('param =', req.query.param)
//     ;(req.params as any).somerthing
// })
