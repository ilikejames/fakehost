import { FC } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { Rest } from '@/components/Rest'
import { Signalr } from '@/components/Signalr'
import { WebContainer, WebContainerProcess } from '@webcontainer/api'

window.addEventListener('load', async () => {
    console.time('startup')
    console.log('webcontainer: booting')
    const webcontainerInstance = await WebContainer.boot();
    console.log('webcontainer: mounting')
    webcontainerInstance.on('error', (error) => {
        console.error('webcontainer: error', error)
    })
    await webcontainerInstance.mount({
        'index.js': {
            file: {
                contents: `
                    import { createServer } from 'http'
                    console.log('Hello from webcontainer')
                    const server = createServer((req, res) => {
                        console.log('Request received', req.method, req.url)
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

                        //if (req.method === 'GET' && req.url === '/') {
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('Hello, world!');
                        //}
                    })
                    server.listen(3000)
                    const instance = server.on('listening', () => {
                        console.log('Server listening', instance.address().port)
                    })
                `
            }
        },
        'package.json': {
            file: {
                contents: `
{
    "name": "example-app",
    "type": "module",
    "scripts": {
        "start": "node index.js"
    }
}
                `
            }

        }
    })
    console.log('webcontainer: awaiting server-ready')
    webcontainerInstance.on('server-ready', (port, url) => {
        console.log(`webcontainer: server-ready on port ${port} at ${url}`)
        console.timeEnd('startup')
    })

    const packageJSON = await webcontainerInstance.fs.readFile('package.json', 'utf-8');
    console.log('package.json', packageJSON)
    const indexJs = await webcontainerInstance.fs.readFile('index.js', 'utf-8');
    console.log('index.js', indexJs)

    console.log('webcontainer: installing')
    const installProcess = await webcontainerInstance.spawn('npm', ['install'])
    logProcess(installProcess)

    const installExitCode = await installProcess.exit
    console.log('webcontainer: installed', installExitCode)

    console.log('webcontainer: starting')
    const startProcess = await webcontainerInstance.spawn('npm', ['run', 'start'])
    logProcess(startProcess)
    console.log('webcontainer: started', await startProcess.exit)

})

const logProcess = (process: WebContainerProcess) => {
    process.output.pipeTo(
        new WritableStream({
            write(data) {
                console.log(data);
            },
        })
    )
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
})


export const App: FC = () => {

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <main>
                <Rest />
                <Signalr />
            </main>
        </ThemeProvider>
    )
}