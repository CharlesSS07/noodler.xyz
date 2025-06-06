import { NodeAPIConnectorManager, NodeLib } from './NodeAPIConnectorManager.js';
import { GradioNodeAPIConnector } from './GradioNodeAPIConnector.js';

export class NodeAPIConnectorRegistry {
    static register<T extends object>(connector: NodeLib<T>) {
        NodeAPIConnectorManager.registerAPIConnector(connector);
    }

    static registerAllAPIConnectors() {
        // convenience function for grabbing cade machine url
        // fewer magick urls
        const cadeURL = (labId: number, nodeId: number, port: number) => {
            return `http://lab${labId}-${nodeId}.eng.utah.edu:${port}`;
        };

        // TODO: pull from a database a queue of spun up instances
        // TODO: implement a way for requesting instance types

        NodeAPIConnectorRegistry.register(
            new GradioNodeAPIConnector('colorizer', cadeURL(1, 9, 2101))
        );

        NodeAPIConnectorRegistry.register(
            new GradioNodeAPIConnector('super-resolution', cadeURL(1, 10, 2101))
        );
    }
}
