import { IStreamResult } from '@microsoft/signalr'
import { Observable } from 'rxjs'

export function observableToStreamResult<T>(observable: Observable<T>): IStreamResult<T> {
    const streamResult: IStreamResult<T> = {
        subscribe: observer => {
            const subscription = observable.subscribe({
                next: value => {
                    observer.next(value)
                },
                error: error => {
                    observer.error(error)
                },
                complete: () => {
                    observer.complete()
                },
            })

            return {
                dispose: () => {
                    subscription.unsubscribe()
                },
            }
        },
    }

    return streamResult
}
