import { devServiceProxy } from './devserverProxy'
import { staticServer } from './staticServer'
import { BootstrapServer, LocalStorage, RuntimeEnvironment } from './types'

export const startAppServer = async (
  pathToStaticDirectoryOrPort: number | string,
  hostPort = 0,
  runtimeEnvironment?: RuntimeEnvironment,
  localStorage?: LocalStorage
) => {
  let host: BootstrapServer

  switch (typeof pathToStaticDirectoryOrPort) {
    case 'number':
      host = await devServiceProxy(
        pathToStaticDirectoryOrPort,
        hostPort,
        runtimeEnvironment,
        localStorage
      )
      break
    default:
      host = await staticServer(
        pathToStaticDirectoryOrPort,
        hostPort,
        runtimeEnvironment,
        localStorage
      )
      break
  }
  return host
}
