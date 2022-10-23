import { green } from 'chalk'
import express from 'express'
import expressProxy from 'express-http-proxy'
import { IncomingMessage } from 'http'
import { startServer, getScriptPayload, logValues } from './helper'
import { BootstrapServer, LocalStorage, RuntimeEnvironment } from './types'

/**
 * Provides a proxy to webpack dev server, populating the app with runtime variables
 * @param envVariables
 * @param path
 * @param proxyPort
 */
export const devServiceProxy = async (
  devserverPort: number,
  proxyPort = 0,
  envVariables?: RuntimeEnvironment,
  localStorage?: LocalStorage
): Promise<BootstrapServer> => {
  const app = express()

  if (proxyPort === devserverPort) {
    throw new Error('Cannot set devServiceProxy port to be the same as the proxyPort.')
  }

  const server = await startServer(app, proxyPort)
  console.info(
    green(`* Proxying http://127.0.0.1:${server.port} -> http://127.0.0.1:${devserverPort}`)
  )
  console.info(green(`* You can now open http://127.0.0.1:${server.port} and: `))
  logValues(envVariables, localStorage)

  const httpProxy = expressProxy(`http://127.0.0.1:${devserverPort}`, {
    userResDecorator: (proxyRes, proxyResData) => {
      if (!isDynamicPage(proxyRes)) {
        return proxyResData
      }
      const contents: string = proxyResData.toString('utf-8')
      const script = getScriptPayload(envVariables, localStorage)
      return `${contents}${script}`
    }
  })

  app.use('/', httpProxy)

  return server
}

const isDynamicPage = (response: IncomingMessage) => {
  try {
    return Boolean(response.headers['content-type']?.includes('text/html'))
  } catch (ex) {
    // swallow
    return false
  }
}
