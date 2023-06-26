import {
    HubConnectionBuilder,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { from, map, shareReplay, switchMap } from 'rxjs'
import { config } from '@/config'
import { fakeServicesReady } from '@/fakeServices'

const connection = new HubConnectionBuilder()
    .withUrl(new URL('/timehub', config.signalrUrl).toString())
    .build()

const connection$ = from(fakeServicesReady).pipe(
    switchMap(() => from(connection.start())),
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
