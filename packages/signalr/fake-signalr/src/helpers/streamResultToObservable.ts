import { IStreamResult } from '@microsoft/signalr'
import { Observable } from 'rxjs'

export const streamResultToObservable = <T>(streamResult: IStreamResult<T>): Observable<T> => {
    return new Observable<T>(observer => {
        const subscription = streamResult.subscribe({
            next: (value: T) => {
                observer.next(value)
            },
            error: (error: unknown) => {
                observer.error(error)
            },
            complete: () => {
                observer.complete()
            },
        })

        return () => {
            subscription.dispose()
        }
    })
}
