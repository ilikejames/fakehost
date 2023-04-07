const getCurrentUrl = () => {
    return `${location.protocol}//${location.host}${location.pathname}`
}
const isUrlWithProtocol = (input: string) => {
    return input.startsWith('http')
}

export const getUrl = (input: RequestInfo | URL) => {
    if (typeof input === 'string') {
        return new URL(input, isUrlWithProtocol(input) ? undefined : getCurrentUrl())
    } else if (input instanceof URL) {
        return input
    } else {
        return new URL(input.url, isUrlWithProtocol(input.url) ? undefined : getCurrentUrl())
    }
}

export const getMethod = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
        return init?.method || 'GET'
    } else if (input instanceof URL) {
        return init?.method || 'GET'
    } else {
        return input.method || 'GET'
    }
}

export const getHeaders = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
        return init?.headers || {}
    } else if (input instanceof URL) {
        return init?.headers || {}
    } else {
        return input.headers || {}
    }
}
