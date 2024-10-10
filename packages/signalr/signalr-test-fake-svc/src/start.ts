import { createServerSignalr } from '@fakehost/signalr'
import { hubs } from './hubs'
import { orderState } from './state'

const PORT = process.env.SIGNALR_PORT ? parseInt(process.env.SIGNALR_PORT) : 5002
createServerSignalr<typeof hubs>({
    url: new URL(`http://localhost:${PORT}`),
    hubs: hubs,
    name: 'fake-signalr',
})

// Start generating
orderState.generator.start()
