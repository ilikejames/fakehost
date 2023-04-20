import { createServerSignalr } from '@fakehost/signalr/server'
import { hubs } from './hubs'

const PORT = process.env.SIGNALR_PORT ? parseInt(process.env.SIGNALR_PORT) : 5002
createServerSignalr<typeof hubs>({
    port: PORT,
    hubs: hubs,
    name: 'fake-signalr',
})
