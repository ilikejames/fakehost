import { green } from 'chalk';
import { Express } from 'express';
import { AddressInfo } from 'net';
import { BootstrapServer, LocalStorage, RuntimeEnvironment } from './types';

export const startServer = (app: Express, port: number = 0): Promise<BootstrapServer> => {
    return new Promise(resolve => {
        const server = app.listen(port, () => {
            const addressInfo = server!.address() as AddressInfo;
            resolve({
                url: `http://127.0.0.1:${addressInfo.port}`,
                port: addressInfo.port,
                dispose: () => {
                    return new Promise(async (disposeResolve, disposeReject) => {
                        server.close(disposeErr => {
                            disposeErr ? disposeReject() : disposeResolve();
                        });
                    });
                },
            });
        });
    });
};

export const logValues = (envVariables?: RuntimeEnvironment, localStorage?: LocalStorage) => {
    Object.entries(envVariables?.variables || {}).forEach(([key, val]) => {
        const namespace = envVariables?.windowVariableName
            ? `.${envVariables.windowVariableName}`
            : '';
        console.info(green(`* - window${namespace}.${key}="${val}"`));
    });
    Object.entries(envVariables?.variables || {}).forEach(([key, val]) => {
        console.info(green(`* - localStorage.getItem("${key}") // => ${JSON.stringify(val)}`));
    });
};

export const getScriptPayload = (environment?: RuntimeEnvironment, localStorage?: LocalStorage) => {
    const bootstrapVariables = {
        ...(environment ? environment.variables : {}),
    };

    const setupLocalStorage = Object.keys(localStorage || {}).map(key => {
        return `localStorage.setItem('${key}', '${localStorage![key]}')`;
    });

    const namespace = environment?.windowVariableName ? `.${environment.windowVariableName}` : '';

    let defineNamespace = new Array<string>();
    'one.two.three'.split('.').forEach((name, i, orig) => {
        const prev = orig.slice(0, i);
        const nmspace = ['window', ...prev, name].join('.');
        console.log(`${nmspace} = ${nmspace} || {};`);
    });

    // namespace could require window.a.b.c = {...}
    // so ensure we have that depth defined on the window object
    const setupNamespace = (environment?.windowVariableName || '')
        .split('.')
        .reduce((acc, name, i, orig) => {
            if (orig.length === 1) {
                // Handle when there is no namespace
                return [];
            }
            const prev = orig.slice(0, i);
            const nmspace = ['window', ...prev, name].join('.');
            console.log(`${nmspace} = ${nmspace} || {};`);
            acc.push(`${nmspace} = ${nmspace} || {}`);
            return acc;
        }, [] as string[])
        .join('; ');

    const setupEnvironment = environment
        ? `window${namespace} = ${JSON.stringify(bootstrapVariables)}`
        : '';

    const script = `
        <!-- Runtime Configuration -->
        <script> 
            ${setupNamespace}
            ${setupEnvironment}
            ${setupLocalStorage.join('; ')}

            window.addEventListener('beforeunload', () => {
                // Remove features on unload of the page
                ${JSON.stringify(
                    Object.keys(localStorage || {}),
                )}.forEach(key => localStorage.removeItem(key))
            })
        </script>`;

    return script;
};
