export const numberGenerator = (start = 0) => {
    return (prev?: number) => (prev ? prev + 1 : start + 1)
}

export const bigintGenerator = (start = BigInt(0)) => {
    return (prev?: bigint) => (prev ? prev + BigInt(1) : start + BigInt(1))
}

/**
 * Creates a generator that generates UUID-like strings.
 * @param offset - the offset to use for the generator an offset of 1 will generate UUIDs starting with 00000001-0000-0000-0000-00000000
 * @returns
 */
export const uuidLikeGenerator = (offset = 0) => {
    const mask = offset.toString(16).padStart(8, '0') + '-0000-0000-0000-00000000'

    return (prev?: string) => {
        if (!prev) {
            return mask.slice(0, 24) + '0'.repeat(12)
        }
        const last = parseInt(prev.slice(-12), 16)
        return mask.slice(0, 24) + (last + 1).toString(16).padStart(12, '0')
    }
}
