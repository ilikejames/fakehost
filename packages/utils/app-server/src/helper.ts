import { green } from 'chalk'
import { Express } from 'express'
import { AddressInfo } from 'net'
import { BootstrapServer, LocalStorage, RuntimeEnvironment } from './types'

export const startServer = async (app: Express, port = 0): Promise<BootstrapServer> => {
    return await new Promise(resolve => {
        const server = app.listen(port, () => {
            const addressInfo = server.address() as AddressInfo
            resolve({
                url: `http://127.0.0.1:${addressInfo.port}`,
                port: addressInfo.port,
                dispose: async () => {
                    return await new Promise<void>((disposeResolve, disposeReject) => {
                        server.close(disposeErr => {
                            disposeErr != null ? disposeReject(disposeErr) : disposeResolve()
                        })
                    })
                },
            })
        })
    })
}

export const logValues = (envVariables?: RuntimeEnvironment, localStorage?: LocalStorage) => {
    Object.entries(envVariables?.variables ?? {}).forEach(([key, val]) => {
        const namespace = envVariables?.windowVariableName
            ? `.${envVariables.windowVariableName}`
            : ''
        console.info(green(`* - window${namespace}.${key}="${val}"`))
    })
    Object.entries(localStorage ?? {}).forEach(([key, val]) => {
        console.info(green(`* - localStorage.getItem("${key}") // => ${JSON.stringify(val)}`))
    })
}

export const getScriptPayload = (
    environment?: RuntimeEnvironment,
    localStorage: LocalStorage = {},
) => {
    const bootstrapVariables = {
        ...(environment != null ? environment.variables : {}),
    }

    const setupLocalStorage = Object.keys(localStorage).map(key => {
        return `localStorage.setItem('${key}', '${localStorage[key]}')`
    })

    const namespace = environment?.windowVariableName ? `.${environment.windowVariableName}` : ''

    // namespace could require window.a.b.c = {...}
    // so ensure we have that depth defined on the window object
    const setupNamespace = (environment?.windowVariableName ?? '')
        .split('.')
        .reduce<string[]>((acc, name, i, orig) => {
            if (orig.length === 1) {
                // Handle when there is no namespace
                return []
            }
            const prev = orig.slice(0, i)
            const nmspace = ['window', ...prev, name].join('.')
            console.log(`${nmspace} = ${nmspace} || {};`)
            acc.push(`${nmspace} = ${nmspace} || {}`)
            return acc
        }, [])
        .join('; ')

    const setupEnvironment =
        environment != null ? `window${namespace} = ${JSON.stringify(bootstrapVariables)}` : ''

    const script = `
        <!-- Runtime Configuration -->
        <script> 
            ${setupNamespace}
            ${setupEnvironment}
            ${setupLocalStorage.join('; ')}

            window.addEventListener('beforeunload', () => {
                // Remove features on unload of the page
                ${JSON.stringify(
                    Object.keys(localStorage != null || {}),
                )}.forEach(key => localStorage.removeItem(key))
            })
        </script>`

    return script
}
