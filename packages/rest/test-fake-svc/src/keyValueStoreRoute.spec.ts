import { KeyValueControllerApi } from '@fakehost/rest-generated-client-api'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { TestEnv, testSetup, getTestTarget } from './testSetup'
import { router } from './router'

describe(`${getTestTarget()}: keyValueStore`, () => {
    let env: TestEnv
    const PREFIX = `test-${Date.now()}`

    beforeAll(async () => {
        env = await testSetup(getTestTarget(), router)
    })

    afterAll(async () => {
        // Clean up all created keys
        const api = new KeyValueControllerApi(env.config)
        const all = await api.getAll()
        const testCases = Object.keys(all).filter(x => x.startsWith(PREFIX))
        await Promise.all(testCases.map(x => api.deleteValue({ key: x })))
        // Tear down
        await env.dispose()
    })

    test('adding values and retrieving', async () => {
        const api = new KeyValueControllerApi(env.config)
        const key1 = `${PREFIX}-key1`
        const key2 = `${PREFIX}-key2`
        await api.createValue({ key: key1, valueWrapper: { value: 'value1' } })
        await api.createValue({ key: key2, valueWrapper: { value: 'value2' } })

        expect(await api.getValue({ key: key1 })).toBe('value1')
        expect(await api.getValue({ key: key2 })).toBe('value2')
        expect(await api.getAll()).toMatchObject({
            [key1]: 'value1',
            [key2]: 'value2',
        })
    })

    test('updating values', async () => {
        const api = new KeyValueControllerApi(env.config)
        const key = `${PREFIX}-update1`
        await api.createValue({ key, valueWrapper: { value: 'value1' } })
        await api.updateValue({ key, valueWrapper: { value: 'value2' } })
        expect(await api.getValue({ key })).toBe('value2')
        expect(await api.getAll()).toMatchObject({
            [key]: 'value2',
        })
    })

    test('deleting values', async () => {
        const api = new KeyValueControllerApi(env.config)
        const key = `${PREFIX}-delete1`
        await api.createValue({ key, valueWrapper: { value: 'value1' } })
        expect.assertions(2)
        expect(await api.getValue({ key })).toMatchObject('value1')
        await api.deleteValue({ key })
        try {
            await api.getValue({ key })
        } catch (err) {
            expect((err as any).response.status).toBe(404)
        }
    })

    describe('invalid', () => {
        test('creating existing values', async () => {
            const api = new KeyValueControllerApi(env.config)
            const key = `${PREFIX}-create1`
            await api.createValue({ key, valueWrapper: { value: 'value1' } })
            expect.assertions(1)
            try {
                await api.createValue({ key, valueWrapper: { value: 'value2' } })
            } catch (err) {
                expect((err as any).response.status).toBe(409)
            }
        })

        test('getting non-existing value', async () => {
            const api = new KeyValueControllerApi(env.config)
            expect.assertions(1)
            try {
                await api.getValue({ key: `${PREFIX}-non-existing` })
            } catch (err) {
                expect((err as any).response.status).toBe(404)
            }
        })

        test('updating non-existing value', async () => {
            const api = new KeyValueControllerApi(env.config)
            expect.assertions(1)
            try {
                await api.updateValue({
                    key: `${PREFIX}-non-existing`,
                    valueWrapper: { value: 'value' },
                })
            } catch (err) {
                expect((err as any).response.status).toBe(404)
            }
        })

        test('deleting non-existing value', async () => {
            const api = new KeyValueControllerApi(env.config)
            expect.assertions(1)
            try {
                await api.deleteValue({ key: `${PREFIX}-non-existing` })
            } catch (err) {
                expect((err as any).response.status).toBe(404)
            }
        })
    })
})
