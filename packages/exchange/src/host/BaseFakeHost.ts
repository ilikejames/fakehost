import { Observable } from 'rxjs';
import { ProtocolHandler } from '../ProtocolHandler';

export type SubscriptionHandler<Request, Response> = (request: Request) => Observable<Response>;

export interface Connection {
    close(): void;
    readonly id: string;
    write(message: string): void;
    isClosed?: boolean;
    query?: { [key: string]: string | string[] };
}

export interface FakeHost {
    readonly url: Promise<string>;
    dispose(): Promise<void>;
    disconnect(): void;
    getConnections(): Connection[];
    start(port?: number): void;
}

export abstract class BaseFakeHost implements FakeHost {
    private _connections = new Array<Connection>();

    constructor(private protocolHandler: ProtocolHandler<unknown, unknown>) {}

    protected onConnection(connection: Connection) {
        this._connections.unshift(connection);
    }

    public getConnections() {
        return this._connections;
    }

    abstract get url(): Promise<string>;

    abstract dispose(): Promise<void>;

    protected onClose(id: string) {
        this._connections.forEach(x => {
            if (x.id === id) {
                x.isClosed = true;
            }
        });
    }

    abstract disconnect(): void;

    abstract start(): void;

    protected onMessage(connection: Connection, raw: string | Buffer) {
        const message = this.protocolHandler.deserialize(raw);
        this.protocolHandler.onMessage(connection, message);
    }
}
