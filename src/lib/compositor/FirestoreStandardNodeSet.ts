import {
    specialtyDataInputDataNodes,
    simpleImageModificationNodes,
    fileLoadingNodes,
    dropboxNodes,
    worldStateDataNodes,
    huggingfaceNodes,
    aiDemoNodes,
    aiInferenceNodes,
    promptDesignNodes,
    googleDriveNodes,
    jimpNodes,
    jsonNodes,
    htmlNodes,
    fileNodes,
    basicMathNodes,
} from '../standardNodes';

export async function generateStandardNodeSuite() {
    const opBuilders = [
        specialtyDataInputDataNodes(),
        simpleImageModificationNodes(),
        // timeRelatedNodes(),
        // worldStateDataNodes(),
        // huggingfaceNodes(),
        // aiDemoNodes(),
        aiInferenceNodes(),
        promptDesignNodes(),
        googleDriveNodes(),
        fileLoadingNodes(),
        // dropboxNodes(),
        jimpNodes(),
        jsonNodes(),
        htmlNodes(),
        basicMathNodes(),
        // fileNodes(),
        // rank3Nodes()
        // buildAllChatGPTNodes()
    ];
    await Promise.all(opBuilders);

    console.log('All STD compositor nodes added.');
}
