import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/nodes/firestore/FirestoreNodeBluePrint.js';
import {
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
} from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const factory: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function nlpNodes() {
    // GENKIT SUMMARIZATION NODE
    const genkitSummarization = await factory.initOfficialNodeBluePrint('genkit_summarization');
    genkitSummarization.title = 'GenKit Summarization';
    genkitSummarization.documentation = 'Advanced text summarization using Google GenKit with Gemini AI.';
    genkitSummarization.tags = [
        'ai',
        'text',
        'remote',
        'summarization',
        'genkit',
        'gemini'
    ]

    genkitSummarization.newInputSocket('content', {
        label: 'Content to Summarize',
        documentation: 'Text content to be summarized.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    genkitSummarization.newInputSocket('maxLength', {
        label: 'Max Length',
        documentation: 'Maximum length of the summary in words.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(150)
            .setMin(10)
            .setMax(500)
            .build(),
    });

    genkitSummarization.newInputSocket('style', {
        label: 'Summary Style',
        documentation: 'Style of summarization: brief, detailed, or bullet-points.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('brief').build(),
    });

    genkitSummarization.newOutputSocket('summary', {
        label: 'Summary',
        documentation: 'The generated summary text.',
        type: STANDARD_DATATYPES.STRING,
    });

    genkitSummarization.newOutputSocket('originalLength', {
        label: 'Original Length',
        documentation: 'Character count of the original content.',
        type: STANDARD_DATATYPES.NUMBER,
    });

    genkitSummarization.newOutputSocket('summaryLength', {
        label: 'Summary Length',
        documentation: 'Character count of the generated summary.',
        type: STANDARD_DATATYPES.NUMBER,
    });

    genkitSummarization.newOutputSocket('compressionRatio', {
        label: 'Compression Ratio',
        documentation: 'Ratio of summary length to original length (0-1).',
        type: STANDARD_DATATYPES.NUMBER,
    });

    genkitSummarization.code = `
        
        // Validate inputs
        if (!inputs.content || typeof inputs.content !== 'string') {
            throw new Error('Content input is required and must be a string');
        }
        
        const result = await utils.aiServices.summarize({
            content: inputs.content,
            maxLength: inputs.maxLength || 150,
            style: inputs.style || 'brief'
        });
        
        // Set outputs
        outputs.set('summary', result.summary);
        outputs.set('originalLength', result.originalLength);
        outputs.set('summaryLength', result.summaryLength);
        outputs.set('compressionRatio', result.compressionRatio);
    `;
}