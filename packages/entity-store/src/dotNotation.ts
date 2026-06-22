import { At } from './types'

export const getValueByDotNotation = <T, K extends string>(
    obj: T,
    path: K,
): At<T, K> | undefined => {
    const keys = path.split('.')
    let current: unknown = obj
    for (const key of keys) {
        if (current == null || typeof current !== 'object' || !(key in current)) return undefined
        current = (current as Record<string, unknown>)[key]
    }
    return current as At<T, K>
}
