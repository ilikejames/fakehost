/**
 * Generates sequential integer ids starting at `start + 1`.
 * Correctly handles id 0 — using `prev !== undefined` rather than truthiness.
 */
export const numberGenerator = (start = 0) => {
    return (prev: number | undefined): number =>
        prev !== undefined ? prev + 1 : start + 1
}

/** Generates sequential bigint ids starting at `start + 1n`. */
export const bigintGenerator = (start = BigInt(0)) => {
    return (prev: bigint | undefined): bigint =>
        prev !== undefined ? prev + BigInt(1) : start + BigInt(1)
}

/**
 * Generates UUID-like strings with a fixed prefix and an incrementing suffix.
 * e.g. `uuidLikeGenerator()` → '00000000-0000-0000-0000-000000000000', '…000001', …
 * `offset` shifts the prefix segment (useful to distinguish entity types in logs).
 */
export const uuidLikeGenerator = (offset = 0) => {
    const prefix = offset.toString(16).padStart(8, '0') + '-0000-0000-0000-'
    return (prev: string | undefined): string => {
        if (prev === undefined) return prefix + '0'.repeat(12)
        const last = parseInt(prev.slice(-12), 16)
        return prefix + (last + 1).toString(16).padStart(12, '0')
    }
}
