import { describe, test, expectTypeOf } from 'vitest'
import {
    At,
    DotNotation,
    DotNotationPaths,
    PickFromDotNotation,
    RequiredFromDotNotation,
} from './types'

describe('types', () => {
    test('At', () => {
        type Entity = { a: { b: { c: number } }; a1: string }
        type Test1 = At<Entity, 'a.b.c'>
        expectTypeOf<Test1>().toEqualTypeOf<number>()
        type Test2 = At<Entity, 'a.b'>
        expectTypeOf<Test2>().toEqualTypeOf<{ c: number }>()
        type Test3 = At<Entity, 'a'>
        expectTypeOf<Test3>().toEqualTypeOf<{ b: { c: number } }>()
    })

    test('DotNotation', () => {
        type Entity = { a: { b: { c: number } }; a1: string }

        type Test1 = DotNotation<Entity, 'a'>
        expectTypeOf<Test1>().toEqualTypeOf<'a' | 'a.b' | 'a.b.c'>()
        type Test2 = DotNotation<Entity, 'a1'>
        expectTypeOf<Test2>().toEqualTypeOf<'a1'>()
    })

    test('DotNotationPaths', () => {
        type Entity = { a: { b: { c: number; d: string } }; e: string }
        type Test1 = DotNotationPaths<Entity>
        expectTypeOf<Test1>().toEqualTypeOf<'a' | 'a.b' | 'a.b.c' | 'a.b.d' | 'e'>()
    })

    test('PickFromDotNotation', () => {
        type Entity = { a: { b: { c: number } }; a1: string }
        type Test1 = PickFromDotNotation<Entity, 'a'>
        expectTypeOf<Test1>().toEqualTypeOf<Pick<Entity, 'a'>>()
        type Test2 = PickFromDotNotation<Entity, 'a.b'>
        expectTypeOf<Test2>().toEqualTypeOf<Pick<Entity, 'a'>>()
        type Test3 = PickFromDotNotation<Entity, 'a1'>
        expectTypeOf<Test3>().toEqualTypeOf<Pick<Entity, 'a1'>>()
        type Test4 = PickFromDotNotation<Entity, 'a.b'>
        expectTypeOf<Test4>().toEqualTypeOf<Pick<Entity, 'a'>>()
    })

    test('RequiredFromDotNotation', () => {
        type Entity = { a: string; b: string; c: { d: string } }
        type Test1 = RequiredFromDotNotation<Entity, 'a'>
        expectTypeOf<Test1['a']>().toEqualTypeOf<string>()
        expectTypeOf<Test1['b']>().toEqualTypeOf<string | undefined>()
        expectTypeOf<Test1['c']>().toEqualTypeOf<{ d?: string } | undefined>()
    })
})
