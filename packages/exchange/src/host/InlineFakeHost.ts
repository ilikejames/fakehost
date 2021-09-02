import colors from 'colors';
import { Server } from 'mock-socket';
import { ProtocolHandler } from '../ProtocolHandler';
import { BaseFakeHost, Connection } from './BaseFakeHost';

export class InlineFakeHost extends BaseFakeHost {
    private server!: Server;
    private fakeUrl!: string;
    private socket: WebSocket | undefined;

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
        return Promise.resolve();
    }

    disconnect() {
        this.socket && this.socket.close();
    }

    start() {
        this.server = new Server(this.fakeUrl);
        this.server.on('connection', socket => {
            this.socket = socket;
            const connectionId = `fake-${Date.now().toString()}`;
            const payload: Connection = {
                id: connectionId,
                close: socket.close,
                write: (raw: string) => socket.send(raw),
            };

            console.info(colors.green(`Started InlineFakeHost on ${this.fakeUrl}`));

            super.onConnection(payload);
            socket.on('close', () => {
                super.onClose(connectionId);
            });

            socket.on('message', (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
                if (typeof data === 'string') {
                    super.onMessage(payload, data);
                }
            });
        });
    }
}
