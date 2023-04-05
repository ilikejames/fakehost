import { ITimeStreamHub } from '@fakehost/signalr-test-api'
import { ConnectionId } from '@fakehost/exchange'
import { map, timer } from 'rxjs'
import { FakeSignalrHub } from '../NewFakeSignalrHub'
import { observableToStreamResult } from './observableToStream'

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
            userMessages.set(this.Connection.id, existing.concat(message.content))
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

timeHub.register('streamTimeAsync', streamTimeAsync)
timeHub.register('clientToServerStreaming', clientToServerStreaming)
timeHub.register('getUploaded', getUploaded)
