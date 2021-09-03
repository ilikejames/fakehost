import { FakeHost } from './host';

export abstract class FakeService {
    private host: FakeHost;
    constructor(host: FakeHost) {
        this.host = host;
    }
}
