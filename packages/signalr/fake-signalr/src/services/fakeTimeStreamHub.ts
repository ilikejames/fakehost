import { ITimeStreamHub } from '@fakehost/signalr-test-api'
import { FakeSignalrHub } from '../FakeSignalrHub'
import { map, timer } from 'rxjs'
import { observableToStreamResult } from './observableToStream'

export const timeHub = new FakeSignalrHub<ITimeStreamHub>('/timehub', {}, 'capitalize')

const uploadedMessages = new Set<string>()

const streamTimeAsync: ITimeStreamHub['streamTimeAsync'] = function (interval) {
    const result = observableToStreamResult(timer(0, interval * 1000).pipe(map(() => new Date().toISOString())))
    return result
}

const clientToServerStreaming: ITimeStreamHub['clientToServerStreaming'] = async function (stream) {
    stream.subscribe({
        next: message => {
            console.log('received', message.content)
            uploadedMessages.add(message.content)
        },
        complete: () => {},
        error: () => {},
    })
}

const getUploaded: ITimeStreamHub['getUploaded'] = async function () {
    return Array.from(uploadedMessages.values())
}

timeHub.register('streamTimeAsync', streamTimeAsync)
timeHub.register('clientToServerStreaming', clientToServerStreaming)
timeHub.register('getUploaded', getUploaded)
