import {
    HubConnectionBuilder,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { from, map, shareReplay, switchMap } from 'rxjs'

const connection = new HubConnectionBuilder().withUrl('http://localhost:9999/timehub').build()

const connection$ = from(connection.start()).pipe(
    map(() => {
        const proxy = getHubProxyFactory('ITimeStreamHub').createHubProxy(connection)
        return proxy
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
)

export const [useTimeHub, timeHub$] = bind(() => {
    return connection$.pipe(
        switchMap(proxy => {
            return streamResultToObservable(proxy.streamTimeAsync(1))
        }),
        map(x => new Date(x)),
    )
}, null)
