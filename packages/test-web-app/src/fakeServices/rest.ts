import { HijackedRestService } from '@fakehost/fake-rest/browser'
import { router, enableLogger } from '@fakehost/rest-test-fake-svc'
import { config } from '@/config'

if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
    enableLogger()
    new HijackedRestService(new URL(config.restUrl), router, { name: config.restUrl })
}
