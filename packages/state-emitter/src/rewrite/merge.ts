import { P } from 'vitest/dist/types-198fd1d9'
import { DeepPartial } from './types'

type MergeResult<T, TPreserveUndefined extends boolean> = TPreserveUndefined extends true
    ? DeepPartial<T>
    : T
/**
 *
 * @param a Source
 * @param b Delta to apply
 * @param options { preserveUndefined?: boolean}
 * - preserveUndefined is true, undefined values in b will be applied to the result
 * @returns
 */
export const merge = <T, TPreserveUndefined extends boolean = false>(
    a: T,
    b: DeepPartial<T>,
    options: { preserveUndefined?: TPreserveUndefined } = {},
): T => {
    const merged = { ...a }

    for (const key in b) {
        const typedKey = key as keyof T
        if (Object.prototype.hasOwnProperty.call(b, key)) {
            const valueB = b[key] as DeepPartial<T[keyof T]>
            let newPropertyValue
            if (typeof valueB === 'object' && valueB !== null && !(valueB instanceof Array)) {
                newPropertyValue = merge(a[typedKey], valueB, options)
            } else if (valueB !== undefined || options.preserveUndefined) {
                newPropertyValue = valueB
            } else {
                continue
            }
            merged[typedKey] = newPropertyValue as T[keyof T]
        }
    }
    return merged
}
