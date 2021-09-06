import colors from 'colors';
import { Server } from 'mock-socket';
import { ProtocolHandler } from '../ProtocolHandler';
import { BaseFakeHost, Connection } from './BaseFakeHost';

export class InlineFakeHost extends BaseFakeHost {
    private fakeUrl!: string;
    public server!: Server;
    private connection?: Connection;

    constructor(protocolHandler: ProtocolHandler<unknown, unknown>, url: string = 'ws://fake:80') {
        super(protocolHandler);
        this.fakeUrl = url;
        this.start();
    }

    get url(): Promise<string> {
        return Promise.resolve(this.fakeUrl);
    }

    dispose(): Promise<void> {
        this.server.close();
        this.server.stop();
        super.onClose(this.connection!.id);
        return Promise.resolve();
    }

    disconnect() {
        // As we are embedded within a browser, we can't just kill the connection.
        // Instead, lets tear down the service...
        this.dispose();
        // ...and restart it 5 seconds later
        this.start();
    }

    start() {
        this.server = new Server(this.fakeUrl, {});
        this.server.on('connection', socket => {
            const connectionId = `fake-${Date.now().toString()}`;
            this.connection = {
                id: connectionId,
                close: socket.close,
                write: (raw: string) => socket.send(raw),
            };

            console.info(colors.green(`Started InlineFakeHost on ${this.fakeUrl}`));

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
