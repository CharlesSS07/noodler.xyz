import {
    specialtyDataInputDataNodes,
    simpleImageModificationNodes,
    fileLoadingNodes,
    aiInferenceNodes,
    promptDesignNodes,
    googleDriveNodes,
    jimpNodes,
    jsonNodes,
    htmlNodes,
    basicMathNodes,
    nlpNodes,
} from './standardNodes';
import { functions } from '../../../../firebase';
import { httpsCallable } from 'firebase/functions';

export async function generateStandardNodeSuite() {
    const opBuilders = [
        specialtyDataInputDataNodes(),
        simpleImageModificationNodes(),
        aiInferenceNodes(),
        promptDesignNodes(),
        googleDriveNodes(),
        fileLoadingNodes(),
        jimpNodes(),
        jsonNodes(),
        htmlNodes(),
        basicMathNodes(),
        nlpNodes(),
    ];
    await Promise.all(opBuilders);

    console.log('All STD compositor nodes added.');
}

export async function embedAllNodes(): Promise<{ processed: number; errors: number; errorDetails: any[] }> {
    const embedAllUnembedded = httpsCallable(functions, 'embedAllUnembeddedNodeBluePrints');
    
    try {
        const result = await embedAllUnembedded({});
        console.log('Embedding result:', result.data);
        return result.data as { processed: number; errors: number; errorDetails: any[] };
    } catch (error) {
        console.error('Failed to embed nodes:', error);
        throw error;
    }
}


