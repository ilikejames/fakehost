import { Observable } from 'rxjs';
import { ServiceError } from './host';
import { Connection, SubscriptionHandler } from './host/BaseFakeHost';

export interface ProtocolHandler<I, O> {
    serialize(message: O): string;
    deserialize(message: string | Buffer): I;
    onMessage(connection: Connection, message: I): void;
    subscribe(
        props: Partial<I>,
        handler: SubscriptionHandler<unknown, unknown>,
        error$?: Observable<ServiceError>,
    ): void;
}
