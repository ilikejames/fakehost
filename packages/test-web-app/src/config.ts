/// <reference types="vite/client" />

type Config = {
    restUrl: string
    signalrUrl: string
}

declare global {
    interface Window {
        config?: Partial<Config>
    }
}

export const config: Config = {
    restUrl: window.config?.restUrl ?? import.meta.env.VITE_REST_SERVICE_URL,
    signalrUrl: window.config?.signalrUrl ?? import.meta.env.VITE_SIGNALR_SERVICE_URL,
}
