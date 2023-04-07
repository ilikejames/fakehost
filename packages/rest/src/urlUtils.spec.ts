import { describe, test, expect, vi } from 'vitest'
import { getUrl } from './urlUtils'

describe('urlUtils', () => {
    const currentUrl = new URL('http://localhost:8080/some/path')
    vi.stubGlobal('location', currentUrl)

    test('getUrl', () => {
        expect(getUrl('http://example.com/api/users').toString()).toBe(
            'http://example.com/api/users',
        )
        expect(getUrl('http://localhost:3000/api/users').toString()).toBe(
            'http://localhost:3000/api/users',
        )
        expect(getUrl('http://localhost:3000').toString()).toBe('http://localhost:3000/')
        expect(getUrl('../relative').toString()).toBe('http://localhost:8080/relative')
        expect(getUrl('./another').toString()).toBe('http://localhost:8080/some/another')

        expect(getUrl('/root').toString()).toBe('http://localhost:8080/root')
    })
})
