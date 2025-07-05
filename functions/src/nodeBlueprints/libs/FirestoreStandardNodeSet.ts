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
} from "./standardNodes";

/**
 * Generates the standard node suite by creating all standard node types.
 * @return {Promise<void>} Promise that resolves when all nodes are created
 */
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

  console.log("All STD compositor libs added.");
}


