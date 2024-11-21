import { CloseConnectionOptions, Host } from '@fakehost/exchange'

export type ServerSignalr<T extends object> = {
    dispose: () => Promise<void>
    url: URL
    host: Host
    disconnect: (hub: keyof T, options?: CloseConnectionOptions) => void
}
