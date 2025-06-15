import {NodeAPIConnectorManager} from "./NodeAPIConnectorManager";
import {AIInferenceAPIConnector} from "./AIServiceConnector";

NodeAPIConnectorManager.registerAPIConnector(
    new AIInferenceAPIConnector('ai_inference')
);