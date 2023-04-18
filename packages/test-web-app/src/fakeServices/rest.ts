import { HijackedRestService } from '@fakehost/fake-rest/browser'
import { router, enableLogger } from '@fakehost/test-rest-api'
import { config } from '@/config'

if (config.bundleFakes) {
    enableLogger()
    new HijackedRestService(new URL(config.restUrl), router, { name: config.restUrl })
}
