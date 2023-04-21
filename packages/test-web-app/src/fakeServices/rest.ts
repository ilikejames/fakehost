import { HijackedRestService } from '@fakehost/fake-rest/browser'
import { router, enableLogger } from '@fakehost/test-rest-api'
import { config } from '@/config'

/***
 * Wire up fake rest service.
 * NOTE: put it behind `import.meta.env.` so vite can tree-shake it await (inc deps)
 */
if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
    enableLogger()
    new HijackedRestService(new URL(config.restUrl), router, { name: config.restUrl })
}
