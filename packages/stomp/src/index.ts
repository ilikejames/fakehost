import { Connection } from '@fakes/exchange';
import { IncomingMessage } from 'http';
import { IncomingMessage, deserialize } from './deserialize';
import { serialize } from './serialize';

export * from './deserialize';
export * from './serialize';

const subscriptionIds = new Map<string, string>();
const userSubscriptions = new Map<string, string>();

// const connectionUsers = new Map<string, string>();

export const onMessage = (connection: Connection, raw: string) => {
    const message = deserialize(raw);
    switch (message.type) {
        case 'CONNECT':
            const connectionResponse = serialize({
                type: 'CONNECTED',
                headers: {
                    version: '1.1',
                    heartBeat: '0,0',
                    userName: 'my-user',
                },
            });
            connection.write(connectionResponse);
            break;

        case 'DISCONNECT':
            connection.close();
            break;

        case 'SUBSCRIBE':
            // id: string,
            //         ask: 'auto' | 'client' | 'client-individual'
            subscriptionIds.set(message.destination!, message.headers['id']);

        case 'UNSUBSCRIBE':
    }
};

// type SubscriptionMessage = IncomingMessage & {
//     headers: {
//         id: string,
//         ask: 'auto' | 'client' | 'client-individual'
//     } & IncomingMessage['headers']
// }

// const isSubscriptionMessage = (o: any): o is SubscriptionMessage => {
//     return o.type === 'SUBSCRIPTION'
// }

/*
    protected onUnSubscribe(connection: Connection, request: UnsubscribeRequest) {
        let subKey: string[] = [];
        this.subscriptionIds.forEach((item, key) => {
            if (item === request.id) {
                subKey.push(key);
            }
        });
        if (subKey.length) {
            subKey.forEach(subscriptionId => {
                this.subscriptionIds.delete(subscriptionId);
            });
        }
        // Close streams
        const streams = this.responseStreamsBySubscription.get(request.id) || [];
        streams.forEach(subscription => subscription && subscription.unsubscribe());
    }
    */
