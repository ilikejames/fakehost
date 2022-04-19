import * as path from 'path'
import { UserConfig } from 'vitest/config'

export const config: UserConfig = {
  test: {
    globals: true,
    setupFiles: [path.join(__dirname, './setup.ts')],
    environment: 'happy-dom'
  },
  resolve: {}
}
