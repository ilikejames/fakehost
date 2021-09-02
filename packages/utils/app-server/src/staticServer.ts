import { green, red } from 'chalk';
import express, { Express } from 'express';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { startServer, getScriptPayload, logValues } from './helper';
import { BootstrapServer, LocalStorage, RuntimeEnvironment } from './types';

const DYNAMIC_PAGE_LIST = ['index.html'];

/**
 * Serves static files in a directory and appends `window` variables for picking up in the UI application
 * @param envVariables
 * @param prebuiltAppDirectory
 * @param port
 */
export const staticServer = async (
    prebuiltAppDirectory: string,
    port: number = 0,
    envVariables?: RuntimeEnvironment,
    localStorage?: LocalStorage,
): Promise<BootstrapServer> => {
    const app = express();
    let server = await startServer(app, port);

    const fullPath = join(process.cwd(), prebuiltAppDirectory as string);

    if (!existsSync(fullPath)) {
        console.error(red(`No prebuilt files found at "${fullPath}"`));
        throw new Error(`Path not found ${fullPath}`);
    }

    console.info(green(`* Static server on ${server.url} hosting "${fullPath}"`));
    console.info(green(`* You can now open ${server.url} and: `));
    logValues(envVariables, localStorage);

    // Statics handled directly
    loadStaticPaths(app, prebuiltAppDirectory);

    // All other pages will get served with variables embedded.
    app.get('*', (_, response) => {
        const index = readFileSync(join(prebuiltAppDirectory, DYNAMIC_PAGE_LIST[0]));
        response.write(index);
        response.write(getScriptPayload(envVariables, localStorage));
        response.end();
    });

    return server;
};

const loadStaticPaths = (app: Express, path: string) => {
    const staticContents = readdirSync(path).filter(x => !DYNAMIC_PAGE_LIST.includes(x));
    for (const staticItem of staticContents) {
        app.use('/' + staticItem, express.static(join(path, staticItem)));
    }
};
