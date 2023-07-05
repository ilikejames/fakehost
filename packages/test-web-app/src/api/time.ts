import {
    HubConnectionBuilder,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { from, map, of, shareReplay, switchMap } from 'rxjs'
import { config } from '@/config'
import { fakeServicesReady } from '@/fakeServices'

const connection$ = from(fakeServicesReady).pipe(
    switchMap(() => {
        const hub = new HubConnectionBuilder()
            .withUrl(new URL('/timehub', config.signalrUrl).toString())
            .build()
        return from(hub.start()).pipe(map(() => hub))
    }),
    shareReplay(1),
)

const service$ = connection$.pipe(
    switchMap(connection => of(getHubProxyFactory('ITimeStreamHub').createHubProxy(connection))),
    shareReplay(1),
)

export const [useTimeHub, timeHub$] = bind(() => {
    return service$.pipe(
        switchMap(proxy => {
            return streamResultToObservable(proxy.streamTimeAsync(1))
        }),
        map(x => new Date(x)),
    )
}, null)
