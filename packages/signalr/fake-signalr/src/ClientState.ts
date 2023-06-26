import { Connection } from '@fakehost/exchange'
import { ISubscription, Subject } from '@microsoft/signalr'
import { Subscription } from 'rxjs'
import { InvocationId } from './messageTypes'

export class ClientState<T = object> {
    public readonly state = {} as T
    // streams service -> client
    public readonly subscriptions = new Map<InvocationId, ISubscription<unknown> | Subscription>()
    // streams client -> service
    public readonly subjects = new Map<InvocationId, Subject<unknown>>()

    constructor(public readonly connection: Connection) {}

    private unsubscribe(id: InvocationId) {
        const subscription = this.subscriptions.get(id)
        if (!subscription) return
        if ('unsubscribe' in subscription) {
            subscription.unsubscribe()
        } else {
            subscription.dispose()
        }
    }

    cleanup(id: InvocationId) {
        const subject = this.subjects.get(id)
        if (subject) {
            subject.complete()
            this.subjects.delete(id)
        }
        const subscription = this.subscriptions.get(id)
        if (subscription) {
            this.unsubscribe(id)
            this.subscriptions.delete(id)
        }
    }

    dispose() {
        Array.from(this.subscriptions.keys()).forEach(id => this.unsubscribe(id))
        this.subjects.forEach(subject => subject.complete())
    }

    setState(key: keyof T, value: T[keyof T]) {
        this.state[key] = value
    }
}
