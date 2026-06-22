import { DeepPartial } from './types'

/**
 * Deep-merges delta `b` onto `a`.
 * By default undefined values in `b` are ignored; set `preserveUndefined: true` to apply them.
 */
export const merge = <T>(
    a: T,
    b: DeepPartial<T>,
    options: { preserveUndefined?: boolean } = {},
): T => {
    const result = { ...a } as T

    for (const key in b) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) continue
        const typedKey = key as keyof T
        const valueB = b[key as keyof T]

        if (typeof valueB === 'object' && valueB !== null && !Array.isArray(valueB)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result[typedKey] = merge(a[typedKey] as any, valueB as DeepPartial<T>, options) as any
        } else if (options.preserveUndefined || valueB !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result[typedKey] = valueB as any
        }
    }

    return result
}
