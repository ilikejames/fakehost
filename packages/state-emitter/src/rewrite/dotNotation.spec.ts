import { test, expect } from 'vitest'
import { getValueByDotNotation } from './dotNotation'

test('dotNotation', () => {
    type Entity = { a: { b: { c: number } }; a1: string }
    const entity: Entity = { a: { b: { c: 1 } }, a1: 'test' }
    expect(getValueByDotNotation(entity, 'a.b.c')).toBe(1)
    expect(getValueByDotNotation(entity, 'a')).toEqual({ b: { c: 1 } })
    expect(getValueByDotNotation(entity, 'a1')).toBe('test')
})
