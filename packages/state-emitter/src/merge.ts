import { DeepPartial } from './types'

/**
 *
 * @param a Source
 * @param b Delta to apply
 * @param options { preserveUndefined?: boolean}
 * - preserveUndefined is true, undefined values in b will be applied to the result
 * @returns
 */
export const merge = <T>(
    a: T,
    b: DeepPartial<T>,
    options: { preserveUndefined?: boolean } = {},
): T => {
    const merged: T = { ...a }

    for (const key in b) {
        const typedKey = key as keyof T
        if (Object.prototype.hasOwnProperty.call(b, key)) {
            const valueB = b[key as keyof T]

            if (typeof valueB === 'object' && valueB !== null && !(valueB instanceof Array)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore-next-line
                merged[typedKey] = merge(
                    a[typedKey] as unknown as T,
                    valueB as DeepPartial<T>,
                    options,
                )
            } else {
                if (options.preserveUndefined && valueB === undefined) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    merged[typedKey] = undefined
                } else if (valueB !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore-next-line
                    merged[typedKey] = valueB
                }
            }
        }
    }

    return merged
}
