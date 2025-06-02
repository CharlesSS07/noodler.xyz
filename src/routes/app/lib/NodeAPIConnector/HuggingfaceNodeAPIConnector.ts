import { APIConnector } from './APIConnector.ts';
import { HfInference } from '@huggingface/inference';

export class HuggingfaceNodeAPIConnector extends APIConnector<HfInference> {
	static KEY = 'huggingface-inference';
	HF_TOKEN: string;

	constructor(HF_TOKEN: string) {
		super(HuggingfaceNodeAPIConnector.KEY);
		this.HF_TOKEN = HF_TOKEN;
	}

	async setupConnection(): Promise<void> {
		this.connection = new HfInference(this.HF_TOKEN);
	}
}
