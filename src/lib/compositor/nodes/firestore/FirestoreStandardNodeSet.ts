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
    basicMathNodes, nlpNodes,
} from './standardNodes';

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
        nlpNodes()
    ];
    await Promise.all(opBuilders);

    console.log('All STD compositor nodes added.');
}
