import { describe, expect, test } from 'vitest'
import { merge } from './merge'
import { DeepPartial } from './types'

type TestType = {
    a: number
    b: {
        c: number
        d: string
    }
}

describe('merge function', () => {
    const objA: TestType = {
        a: 1,
        b: {
            c: 2,
            d: 'hello',
        },
    }

    const objB: DeepPartial<TestType> = {
        a: undefined,
        b: {
            c: 5,
            d: undefined,
        },
    }

    test('merges two objects without preserving undefined', () => {
        expect(merge(objA, { a: 3 })).toEqual({
            a: 3,
            b: objA.b,
        })
        expect(merge(objA, { a: 3, b: { c: 1 } })).toEqual({
            a: 3,
            b: {
                c: 1,
                d: 'hello',
            },
        })
    })

    test('merges two objects while preserving undefined but not overwriting missing keys', () => {
        const result = merge(objA, { a: undefined }, { preserveUndefined: true })
        expect(result).toEqual({
            a: undefined,
            b: objA.b,
        })
    })

    test('merges two object while preserving undefined', () => {
        const result = merge(objA, objB, { preserveUndefined: true })
        expect(result).toEqual({
            a: undefined,
            b: {
                c: 5,
                d: undefined,
            },
        })
    })

    test('merges nested objects without preserving undefined', () => {
        const result = merge(objA, objB, {})
        expect(result).toEqual({
            a: 1,
            b: {
                c: 5,
                d: 'hello',
            },
        })
    })
})
