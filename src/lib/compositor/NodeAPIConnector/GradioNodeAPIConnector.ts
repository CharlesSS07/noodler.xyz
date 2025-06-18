import { Client } from '@gradio/client';
import { NodeLib } from './NodeAPIConnectorManager.js';

export class GradioNodeAPIConnector extends NodeLib<Client> {
    endpointString: string;

    constructor(name: string, endpointString: string) {
        super(`GradioAPI/${name}`);
        this.endpointString = endpointString;
    }

    async setupConnection(): Promise<void> {
        this.connection = await Client.connect(this.endpointString);
    }
}
