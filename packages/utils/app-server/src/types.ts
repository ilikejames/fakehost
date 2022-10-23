export interface BootstrapServer {
  port: number
  url: string
  dispose: () => Promise<void>
}

export interface RuntimeEnvironment {
  windowVariableName?: string
  variables: Record<string, string>
}

export type LocalStorage = Record<string, string>
