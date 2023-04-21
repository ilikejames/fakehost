import '@/fakeServices'
import ReactDomClient from 'react-dom/client'
import { Rest } from '@/components/Rest'
import { Signalr } from '@/components/Signalr'

const container = document.getElementById('root')!
const root = ReactDomClient.createRoot(container)
root.render((
    <div>
        <Rest />
        <Signalr />
    </div>
))

