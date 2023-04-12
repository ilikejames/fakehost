import URL from 'url'
import { Route } from './types'

export const getRouteParams = (route: Route, requestUrl: URL) => {
    const paramValues = route.regexp.exec(requestUrl.pathname)
    const params = route.keys.reduce((acc, key, i) => {
        if (paramValues) {
            acc[key.name] = paramValues[i + 1]
        }
        return acc
    }, {} as Record<string, string>)
    return params
}
