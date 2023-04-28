import { At } from './types'

export const getValueByDotNotation = <T, K extends string>(
    obj: T,
    dotNotation: K,
): At<T, K> | undefined => {
    const keys = dotNotation.split('.')
    let currentObj: unknown | undefined = obj

    for (const key of keys) {
        if (typeof currentObj === 'object' && currentObj !== null && key in currentObj) {
            currentObj = currentObj[key as keyof typeof currentObj]
        } else {
            return
        }
    }
    return currentObj as At<T, K>
}

export const createNumberIdGenerator = (start = 0) => {
    let lastId = start
    return () => ++lastId
}
