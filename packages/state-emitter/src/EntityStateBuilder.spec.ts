import { describe, expect, test } from 'vitest'
import { EntityStateBuilder } from './EntityStateBuilder'

describe('EntityStateBuilder', () => {
    test('when no entity generator supplied', () => {
        expect.assertions(1)
        const state = new EntityStateBuilder<{ id: number }, 'id'>('id')
        try {
            state.build()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            expect(e.message).toBe('No entity generator supplied')
        }
    })
})
