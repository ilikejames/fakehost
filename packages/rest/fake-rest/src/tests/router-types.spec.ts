import { test, describe, expectTypeOf, expect } from 'vitest'
import { ExtendableRecord, ExtractRouteSection, ExtractQuerySection, RestHandler } from '../types'

describe('router types', () => {
    test('ExtractRouteSection', () => {
        expectTypeOf<ExtractRouteSection<'/'>>().toEqualTypeOf<'/'>()

        expectTypeOf<
            ExtractRouteSection<'/api/endpoint/:id'>
        >().toEqualTypeOf<'/api/endpoint/:id'>()

        expectTypeOf<
            ExtractRouteSection<'/api/endpoint/:id?something=:something'>
        >().toEqualTypeOf<'/api/endpoint/:id'>()
    })

    test('ExtractQuerySection', () => {
        expectTypeOf<ExtractQuerySection<'/'>>().toEqualTypeOf<''>()
        expectTypeOf<ExtractQuerySection<'/:id?name=:name'>>().toEqualTypeOf<'name=:name'>()
        expectTypeOf<
            ExtractQuerySection<'/:id?name=:name&ts=:ts'>
        >().toEqualTypeOf<'name=:name&ts=:ts'>()
    })

    test('extracts single param from path', () => {
        type TestHandler = RestHandler<'/api/endpoint/:id'>
        type ParamRequest = Parameters<TestHandler>[0]
        type TestParams = ParamRequest['params']
        expectTypeOf<TestParams>().toEqualTypeOf<{ id: string }>()
    })

    test('extracts multiple param from path', () => {
        type TestHandler = RestHandler<'/api/endpoint/:id/:name'>
        type ParamRequest = Parameters<TestHandler>[0]
        type TestParams = ParamRequest['params']
        expectTypeOf<TestParams>().toEqualTypeOf<{ id: string; name: string }>()
    })

    test('extracts single querystring parameter', () => {
        type TestHandler = RestHandler<'/api/endpoint/?id=:id'>
        type ParamRequest = Parameters<TestHandler>[0]
        type TestQuery = ParamRequest['query']
        expectTypeOf<TestQuery>().toEqualTypeOf<ExtendableRecord<{ id: string | undefined }>>()
        expectTypeOf<TestQuery['id']>().toEqualTypeOf<string | undefined>()
        expectTypeOf<TestQuery['unknown']>().toEqualTypeOf<string | undefined>()
    })

    test('extracts multiple querystring parameter', () => {
        type TestHandler = RestHandler<'/api/endpoint/?id=:id&name=:name'>
        type ParamRequest = Parameters<TestHandler>[0]
        type TestQuery = ParamRequest['query']
        expectTypeOf<TestQuery>().toEqualTypeOf<
            ExtendableRecord<{ id: string | undefined; name: string | undefined }>
        >()
        expectTypeOf<TestQuery['id']>().toEqualTypeOf<string | undefined>()
        expectTypeOf<TestQuery['name']>().toEqualTypeOf<string | undefined>()
        expectTypeOf<TestQuery['unknown']>().toEqualTypeOf<string | undefined>()
    })

    test('extracts params and querystring', () => {
        type TestHandler = RestHandler<'/api/endpoint/:id/:name?ts=:ts&v=:v'>
        type ParamRequest = Parameters<TestHandler>[0]
        type TestParams = ParamRequest['params']
        type TestQuery = ParamRequest['query']

        expectTypeOf<TestParams>().toEqualTypeOf<{ id: string; name: string }>()
        expectTypeOf<TestQuery>().toEqualTypeOf<
            ExtendableRecord<{ ts: string | undefined; v: string | undefined }>
        >()
    })
})
