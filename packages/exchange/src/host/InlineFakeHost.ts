import chalk from 'chalk';
import { Server, WebSocket as MockedSocket } from 'mock-socket';
import { ProtocolHandler } from '../ProtocolHandler';
import { BaseFakeHost, Connection } from './BaseFakeHost';
import { enableLogger, logger } from './logger';

export class InlineFakeHost extends BaseFakeHost {
    private readonly fakeUrl!: string;
    private server?: Server;
    private connection?: Connection;
    private socket?: MockedSocket;
    public Websocket = MockedSocket;

    constructor(
        protocolHandler: ProtocolHandler<unknown, unknown>,
        url = 'ws://localhost:5555',
        debug = false,
    ) {
        super(protocolHandler);
        this.fakeUrl = url;
        this.start();
        debug && enableLogger();
    }

    get url(): Promise<string> {
        return Promise.resolve(this.fakeUrl);
    }

    async dispose(): Promise<void> {
        if (this.server == null) return await Promise.resolve();
        this.server.stop();
        this.socket?.close();
        this.connection != null && super.onClose(this.connection.id);
        return await Promise.resolve();
    }

    disconnect() {
        this.socket?.close();
    }

    start() {
        this.server = new Server(this.fakeUrl, {});
        console.log(chalk.green(`Started InlineFakeHost on ${this.fakeUrl}`));

        this.server.on('connection', socket => {
            if (this.refuseNewConnections) {
                logger('Refusing new connection');
                socket.close();
                return;
            }
            this.socket = socket;
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
                if (!this.connection) {
                    return;
                }
                if (typeof data === 'string') {
                    super.onMessage(this.connection, data);
                } else if (!(data instanceof Blob)) {
                    super.onMessage(this.connection, data as Buffer);
                } else {
                    throw new Error('Unsupported type "Blob');
                }
            });
        });
    }
}
