import chalk from 'chalk';
import { AddressInfo } from 'net';
import WebSocket from 'ws';
import { v4 as uuid } from 'uuid';
import { ProtocolHandler } from '../ProtocolHandler';
import { BaseFakeHost, Connection } from './BaseFakeHost';

export class WsFakeHost extends BaseFakeHost {
    private websocket!: WebSocket.Server;
    private serverPort?: number;
    private connections = new Map<string, WebSocket>();

    constructor(
        protocolHandler: ProtocolHandler<unknown, unknown>,
        port?: number,
        private path: string = '/json',
    ) {
        super(protocolHandler);
        this.start(port);
    }

    public start(port: number = 0) {
        if (this.websocket) {
            console.warn('Server already running.');
            return;
        }

        this.websocket = new WebSocket.Server({
            port,
            path: this.path,
        });

        this.websocket.on('listening', () => {
            const address = this.websocket.address() as AddressInfo;
            this.serverPort = address.port;
            console.info(chalk.green(`Started WsFakeHost on ${address.port}`));
        });

        this.websocket.on('connection', socket => {
            if (this.refuseNewConnections) {
                console.log('Refusing new connection');
                socket.close();
                return;
            }

            const id = uuid();
            this.connections.set(id, socket);

            const connection: Connection = {
                id,
                close: () => {
                    socket.close();
                },
                write: (raw: string) => {
                    socket.send(raw);
                },
            };

            this.onConnection(connection);

            socket.on('message', (raw: string | Buffer) => {
                this.onMessage(connection, raw);
            });

            socket.on('close', () => {
                this.onClose(id);
                this.connections.delete(id);
                super.onClose(id);
            });
        });
    }

    get url(): Promise<string> {
        return this.port.then(port => {
            return `http://127.0.0.1:${port}${this.path}`;
        });
    }

    private get port(): Promise<number> {
        // When the port is set with 0, it will startup on a free port
        // We only get this port once the service has started.
        return new Promise(resolve => {
            const intervalId = setInterval(() => {
                if (this.serverPort) {
                    clearInterval(intervalId);
                    resolve(this.serverPort);
                }
            }, 1);
        });
    }

    async dispose(): Promise<void> {
        this.disconnect();
        return new Promise((resolve, reject) => {
            this.websocket.close(err => {
                console.log(chalk.red('Disposed.'));
                return err ? reject() : resolve();
            });
        });
    }

    disconnect() {
        console.log(chalk.yellow('Disconnecting clients.'));
        this.connections.forEach(connection => {
            connection.close();
        });
    }
}
