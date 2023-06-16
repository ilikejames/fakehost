import { FakeSignalrHub, ConnectionId } from '@fakehost/signalr'
import { ITimeStreamHub, observableToStreamResult } from '@fakehost/signalr-test-client-api'
import { map, of, switchMap, throwError, timer } from 'rxjs'

export const timeHub = new FakeSignalrHub<ITimeStreamHub>('/timehub', {}, 'capitalize')

const userMessages = new Map<ConnectionId, string[]>()

const streamTimeAsync: ITimeStreamHub['streamTimeAsync'] = function (interval) {
    const result = observableToStreamResult(
        timer(0, interval * 1000).pipe(map(() => new Date().toISOString())),
    )
    return result
}

const clientToServerStreaming: ITimeStreamHub['clientToServerStreaming'] = async function (
    this: typeof timeHub.thisInstance,
    stream,
) {
    stream.subscribe({
        next: message => {
            const existing = userMessages.get(this.Connection.id) ?? []
            userMessages.set(this.Connection.id, existing.concat(message))
        },
        complete: () => {
            console.log('complete')
        },
        error: err => {
            console.log('error', err)
        },
    })
}

const getUploaded: ITimeStreamHub['getUploaded'] = async function (
    this: typeof timeHub.thisInstance,
) {
    return Array.from(userMessages.get(this.Connection.id) ?? [])
}

const alwaysErrors: ITimeStreamHub['alwaysErrors'] = () => {
    return observableToStreamResult<string>(
        throwError(() => new Error(`An unexpected error occurred invoking 'AlwaysErrors'`)),
    )
}

const alwaysErrorsOnTheSecondEmit: ITimeStreamHub['alwaysErrorsOnTheSecondEmit'] = () => {
    return observableToStreamResult<string>(
        timer(100, 500).pipe(
            switchMap(i => {
                switch (i) {
                    case 0:
                        return of('first')
                    default:
                        return throwError(
                            () =>
                                new Error(
                                    'An error occurred on the server while streaming results.',
                                ),
                        )
                }
            }),
        ),
    )
}

timeHub.register('streamTimeAsync', streamTimeAsync)
timeHub.register('clientToServerStreaming', clientToServerStreaming)
timeHub.register('getUploaded', getUploaded)
timeHub.register('alwaysErrors', alwaysErrors)
timeHub.register('alwaysErrorsOnTheSecondEmit', alwaysErrorsOnTheSecondEmit)
