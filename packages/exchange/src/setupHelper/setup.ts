import { InlineFakeHost, WsFakeHost } from '../host'
import { ProtocolHandler, ServiceDefinition } from '../ProtocolHandler'

export const setupBrowserBundled = <Req, Res>(
  protocol: ProtocolHandler<Req, Res>,
  services: Array<ServiceDefinition<Partial<Req>>>,
  url: string
) => {
  const host = new InlineFakeHost(protocol, url)
  services.forEach(svc => {
    protocol.subscribe(svc)
  })
  return host
}

export const setupWsFakeHost = <Req, Res>(
  protocol: ProtocolHandler<Req, Res>,
  services: Array<ServiceDefinition<Partial<Req>>>,
  port?: number
) => {
  const host = new WsFakeHost(protocol, port, '/json')
  services.forEach(svc => {
    protocol.subscribe(svc)
  })
  return host
}
