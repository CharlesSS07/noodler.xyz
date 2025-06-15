import {NodeLib} from "./NodeAPIConnectorManager";
import {AIInferenceService} from "$lib/services";
import {auth} from "../../../../firebase";

export class AIInferenceAPIConnector extends NodeLib<AIInferenceService> {
    async setupConnection(): Promise<void> {
        await auth.onAuthStateChanged((user) => {
            if (user) {
                this.connection = new AIInferenceService({
                    user: user,
                });
            }
        });
        return Promise.resolve();
    }

}
