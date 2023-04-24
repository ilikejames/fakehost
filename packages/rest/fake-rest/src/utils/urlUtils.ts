const getCurrentUrl = () => {
    return `${location.protocol}//${location.host}${location.pathname}`
}
const isUrlWithProtocol = (input: string) => {
    return input.indexOf('http') === 0
}

const getFullUrl = (input: string | { url: string } | { href: string }) => {
    if (typeof input === 'string') {
        return input
    }
    if ('url' in input) {
        return input.url
    }
    if ('href' in input) {
        return input.href
    }
    return ''
}
export const getUrl = (input: RequestInfo | URL) => {
    if (typeof input === 'string') {
        return new URL(input, isUrlWithProtocol(input) ? undefined : getCurrentUrl())
    } else if (input instanceof URL) {
        return input
    } else {
        const url = getFullUrl(input)
        return new URL(url, isUrlWithProtocol(url) ? undefined : getCurrentUrl())
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
