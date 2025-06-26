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

    // TEXT FORMATTER LLM NODE
    const textFormatterLLM = await factory.initOfficialNodeBluePrint('text_formatter_llm');
    textFormatterLLM.title = 'Text Formatter LLM';
    textFormatterLLM.documentation = 'Format and restructure text content using LLM-powered formatting rules and styles.';
    textFormatterLLM.tags = [
        'ai',
        'text',
        'remote',
        'formatting',
        'llm',
        'style'
    ]

    textFormatterLLM.newInputSocket('content', {
        label: 'Content to Format',
        documentation: 'Text content to be formatted.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    textFormatterLLM.newInputSocket('formatStyle', {
        label: 'Format Style',
        documentation: 'Formatting style: markdown, html, plain, bullet-points, numbered-list, or custom.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('markdown').build(),
    });

    textFormatterLLM.newInputSocket('customInstructions', {
        label: 'Custom Instructions',
        documentation: 'Custom formatting instructions when format style is set to "custom".',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    textFormatterLLM.newOutputSocket('formattedText', {
        label: 'Formatted Text',
        documentation: 'The formatted text output.',
        type: STANDARD_DATATYPES.STRING,
    });

    textFormatterLLM.newOutputSocket('originalLength', {
        label: 'Original Length',
        documentation: 'Character count of the original content.',
        type: STANDARD_DATATYPES.NUMBER,
    });

    textFormatterLLM.newOutputSocket('formattedLength', {
        label: 'Formatted Length',
        documentation: 'Character count of the formatted text.',
        type: STANDARD_DATATYPES.NUMBER,
    });

    textFormatterLLM.code = `
        
        // Validate inputs
        if (!inputs.content || typeof inputs.content !== 'string') {
            throw new Error('Content input is required and must be a string');
        }
        
        // Map node inputs to cloud function schema
        const formatStyle = inputs.formatStyle || 'markdown';
        const customInstructions = inputs.customInstructions || '';
        
        // Build format rules based on style and custom instructions
        let formatRules = '';
        if (formatStyle === 'custom') {
            formatRules = customInstructions || 'Format the text appropriately';
        } else {
            formatRules = \`Format as \${formatStyle}\`;
            if (customInstructions) {
                formatRules += \`. Additional instructions: \${customInstructions}\`;
            }
        }
        
        const result = await utils.aiServices.formatText({
            text: inputs.content,
            formatRules: formatRules,
            outputType: formatStyle === 'custom' ? 'plain' : formatStyle,
            preserveContent: true,
            maxOutputLength: 2000
        });
        
        // Set outputs
        outputs.set('formattedText', result.formattedText);
        outputs.set('originalLength', result.originalLength);
        outputs.set('formattedLength', result.formattedLength);
    `;
}