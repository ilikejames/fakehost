export { }
import ReactDomClient from 'react-dom/client'
import React from 'react'
import './fakeServices/rest'
import './fakeServices/signalr'
import { Rest } from './Rest'

const container = document.getElementById('root')!
const root = ReactDomClient.createRoot(container)
root.render((
    <div>
        <Rest />
    </div>
))
