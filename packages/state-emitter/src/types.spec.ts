import { describe, test, expectTypeOf } from 'vitest'
import {
    AddToUnion,
    PickFromDotNotation,
    RemoveFromUnion,
    RequiredFromDotNotation,
    RemoveNever,
} from './types'

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

describe('type checking', () => {
    describe('PickFromDotNotation', () => {
        test('shallow required field', () => {
            type T = PickFromDotNotation<Entity, 'id'>
            expectTypeOf<T>().toEqualTypeOf<{ id: bigint }>()
            expectTypeOf<T>().not.toEqualTypeOf<{ id: number }>()
        })

        test('deeper required field', () => {
            type T = PickFromDotNotation<Entity, 'payload.orderId'>
            expectTypeOf<T>().toEqualTypeOf<{ payload: { orderId: bigint } }>()
            expectTypeOf<T>().not.toEqualTypeOf<{ payload: { orderId: string } }>()
        })

        test('incorrect path', () => {
            type T = PickFromDotNotation<Entity, 'payload.orderId2'>
            expectTypeOf<T>().toEqualTypeOf<{ payload: never }>()
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

    describe('unions', () => {
        test('RemoveFromUnion', () => {
            type T = 'a' | 'b' | 'c'
            expectTypeOf<RemoveFromUnion<T, 'b'>>().toEqualTypeOf<'a' | 'c'>()
            expectTypeOf<RemoveFromUnion<T, 'b' | 'a'>>().toEqualTypeOf<'c'>()
        })

        test('AddToUnion', () => {
            type T = 'a' | 'b' | 'c'
            expectTypeOf<AddToUnion<T, 'd'>>().toEqualTypeOf<'a' | 'b' | 'c' | 'd'>()
            expectTypeOf<AddToUnion<T, 'd' | 'e'>>().toEqualTypeOf<'a' | 'b' | 'c' | 'd' | 'e'>()
        })
    })

    test('RemoveNever', () => {
        type Test1 = RemoveNever<{ a: 1; b: never }>
        expectTypeOf<Test1>().toEqualTypeOf<{ a: 1 }>()
        expectTypeOf<Test1>().not.toEqualTypeOf<{ a: 1; b: never }>()
    })
})
