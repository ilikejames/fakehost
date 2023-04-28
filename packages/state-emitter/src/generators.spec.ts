import { describe, test, expect } from 'vitest'
import { uuidLikeGenerator, numberGenerator } from './generators'

describe('generators', () => {
    test('numberGenerator', async () => {
        let prev: number | undefined = undefined
        const generator = numberGenerator()
        expect((prev = generator())).toBe(1)
        expect((prev = generator(prev))).toBe(2)
        expect((prev = generator(prev))).toBe(3)

        const generator2 = numberGenerator(10)
        expect((prev = generator2())).toBe(11)
        expect((prev = generator2(prev))).toBe(12)
    })

    test('uuidLikeGenerator', async () => {
        let prev: string | undefined = undefined
        const generator = uuidLikeGenerator()
        expect((prev = generator())).toBe('00000000-0000-0000-0000-000000000000')
        expect(generator(prev)).toBe('00000000-0000-0000-0000-000000000001')

        const generator2 = uuidLikeGenerator(10)
        expect((prev = generator2())).toBe('0000000a-0000-0000-0000-000000000000')
        expect(generator2(prev)).toBe('0000000a-0000-0000-0000-000000000001')
    })
})
