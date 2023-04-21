import {
    HubConnectionBuilder,
    getHubProxyFactory,
    streamResultToObservable,
} from '@fakehost/signalr-test-client-api'
import { bind } from '@react-rxjs/core'
import { from, map, shareReplay, switchMap } from 'rxjs'
import { config } from '@/config'
import { HubConnection } from '@microsoft/signalr'

let connection: HubConnection

const getConnection = () => {
    if (!connection) {
        connection = new HubConnectionBuilder()
            .withUrl(new URL('/timehub', config.signalrUrl).toString())
            .build()
    }
    return connection
}

const connection$ = from(getConnection().start()).pipe(
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
