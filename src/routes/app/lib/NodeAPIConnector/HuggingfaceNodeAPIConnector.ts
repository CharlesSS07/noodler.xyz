import { NodeLib } from './NodeAPIConnectorManager.js';

// Temporary interface until @huggingface/inference is properly installed
interface HfInference {
    textGeneration(params: Record<string, unknown>): Promise<{ generated_text: string }>;
    textToImage(params: Record<string, unknown>): Promise<Blob>;
}

export class HuggingfaceNodeAPIConnector extends NodeLib<HfInference> {
    static KEY = 'huggingface-inference';
    HF_TOKEN: string;

    constructor(HF_TOKEN: string) {
        super(HuggingfaceNodeAPIConnector.KEY);
        this.HF_TOKEN = HF_TOKEN;
    }

    async setupConnection(): Promise<void> {
        // TODO: Implement once @huggingface/inference is installed
        throw new Error('HuggingFace connector not yet implemented');
    }
}
