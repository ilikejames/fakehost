import { Key } from 'path-to-regexp'

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type Request<T extends string> = {
    method: Methods
    url: string
    host: string
    query: ExtractQueryParams<RemoveParentheses<T>>
    params: ExtractRouteParams<RemoveParentheses<T>>
    headers: Record<string, string>
    body: unknown
}

export type Response = {
    status: (code: number) => Response
    send: (data: object | string | number | unknown[]) => Response
    json: (data: object | string | number | unknown[]) => Response
    end: () => void
}

export type Next = () => void

export type Handler<T extends string> = (req: Request<T>, res: Response, next: Next) => void

type ExtractRouteParams<T> = T extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : T extends `${string}/:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, string> // {}

type RemoveParentheses<T extends string> = T extends `${infer Before}\(${string}\)${infer After}`
    ? `${Before}${After}`
    : T

type ExtractQueryParams<T extends string> = string extends T
    ? Record<string, string>
    : T extends `${string}?${infer U}`
    ? U extends `${infer Query}&${infer Rest}`
        ? Record<
              Query extends `${infer Key}=${string}` ? Key : never,
              Query extends `${string}=${infer Value}` ? Value : never
          > &
              ExtractQueryParams<`?${Rest}`>
        : U extends `${infer Query}`
        ? Record<
              Query extends `${infer Key}=${string}` ? Key : never,
              Query extends `${string}=${infer Value}` ? Value : never
          >
        : Record<string, string>
    : Record<string, string>

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
    METHOD: <Path extends string>(method: Methods, path: Path, handler: Handler<Path>) => RestRouter
    get: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    post: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
}
