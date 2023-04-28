import { describe, test } from 'vitest'
import { PickFromDotNotation, RequiredFromDotNotation } from './types'

// Not a unit test, just type checking
type Entity = {
    id: bigint
    payload: {
        orderId: bigint
        name: string
        child: {
            id: bigint
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('type checking', () => {
    // Only type checking in here, no assertions

    describe('PickFromDotNotation', () => {
        test('shallow required field', () => {
            type T = PickFromDotNotation<Entity, 'id'>
            type Assert = Expect<Equal<T, { id: bigint }>>
            // @ts-expect-error wrong type
            type ShouldFail = Expect<Equal<T, { id: number }>>
        })

        test('deeper required field', () => {
            type T = PickFromDotNotation<Entity, 'payload.orderId'>
            type Assert = Expect<Equal<T, { payload: { orderId: bigint } }>>
            // @ts-expect-error wrong type
            type ShouldFail = Expect<Equal<T, { payload: { orderId: string } }>>
        })

        test('incorrect path', () => {
            type T = PickFromDotNotation<Entity, 'payload.orderId2'>
            type Assert = Expect<Equal<T, { payload: never }>>
        })
    })

    describe('RequiredFromDotNotation', () => {
        const fn = <T, K extends string>(payload: RequiredFromDotNotation<T, K>) => payload

        test('requires path parameter', () => {
            // @ts-expect-error wrong path
            fn<Entity, 'id'>({})
            // @ts-expect-error wrong path
            fn<Entity, 'payload.id'>({ id: BigInt(1) })
        })

        test('requires valid type of path parameter', () => {
            fn<Entity, 'id'>({ id: BigInt(1) })
            fn<Entity, 'payload.orderId'>({ payload: { orderId: BigInt(1) } })

            // @ts-expect-error wrong type
            fn<Entity, 'id'>({ id: 1 })
            // @ts-expect-error wrong type
            fn<Entity, 'payload.orderId'>({ payload: { orderId: 1 } })
        })

        test('other params are optional', () => {
            fn<Entity, 'id'>({ id: BigInt(1), payload: {} })
            fn<Entity, 'id'>({ id: BigInt(1), payload: { orderId: BigInt(1) } })
            fn<Entity, 'payload.orderId'>({
                id: BigInt(1),
                payload: { orderId: BigInt(1), name: 'test' },
            })
        })
    })
})
/* eslint-enable @typescript-eslint/no-unused-vars */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Compute<T> = T extends (...args: any[]) => any ? T : { [K in keyof T]: Compute<T[K]> }

export type Equal<X, Y> = (<T>() => T extends Compute<X> ? 1 : 2) extends <
    T,
>() => T extends Compute<Y> ? 1 : 2
    ? true
    : false

export type Expect<T extends true> = T extends true ? true : never
