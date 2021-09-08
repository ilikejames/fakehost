import colors from 'colors';
import { Server, WebSocket as MockedSocket } from 'mock-socket';
import { ProtocolHandler } from '../ProtocolHandler';
import { BaseFakeHost, Connection } from './BaseFakeHost';

export class InlineFakeHost extends BaseFakeHost {
    private fakeUrl!: string;
    private server?: Server;
    private connection?: Connection;
    public websocket = MockedSocket;

    constructor(
        protocolHandler: ProtocolHandler<unknown, unknown>,
        url: string = 'ws://localhost:5555',
    ) {
        super(protocolHandler);
        this.fakeUrl = url;
        this.start();
    }

    get url(): Promise<string> {
        return Promise.resolve(this.fakeUrl);
    }

    dispose(): Promise<void> {
        if (!this.server) return Promise.resolve();
        this.server.stop();
        this.connection && super.onClose(this.connection!.id);
        return Promise.resolve();
    }

    disconnect() {
        // As we are embedded within a browser, we can't just kill the connection.
        // Instead, lets tear down the service...
        this.dispose();
        // ...and restart it 5 seconds later
        setTimeout(this.start, 5000);
    }

    start() {
        if (this.server) {
            this.server.start();
            console.info(colors.green(`Restarted InlineFakeHost on ${this.fakeUrl}`));
            return;
        }
        this.server = new Server(this.fakeUrl, {});
        console.info(colors.green(`Started InlineFakeHost on ${this.fakeUrl}`));

        this.server.on('connection', socket => {
            const connectionId = `fake-${Date.now().toString()}`;
            this.connection = {
                id: connectionId,
                close: socket.close,
                write: (raw: string) => socket.send(raw),
            };

            super.onConnection(this.connection);

            socket.on('close', () => {
                super.onClose(connectionId);
            });

            socket.on('message', (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
                if (typeof data === 'string') {
                    super.onMessage(this.connection!, data);
                }
            });
        });
    }
}
