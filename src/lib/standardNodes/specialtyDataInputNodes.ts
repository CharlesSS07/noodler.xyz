import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    GenericSocketParamsBuilder,
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function specialtyDataInputDataNodes() {
    const rawTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'raw_text_editor'
        );
    rawTextEditor.title = 'Raw Text Editor';
    rawTextEditor.documentation = 'Displays or intakes text data.';

    rawTextEditor.newInputSocket('inputText', {
        label: 'Text',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    rawTextEditor.newOutputSocket('outputText', {
        label: 'Text',
        documentation: '',
        type: 'string',
    });

    rawTextEditor.code = `outputs.set("outputText", inputs.inputText);`;

    const completeTextHuggingfaceLLM =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'huggingface_complete_text'
        );
    completeTextHuggingfaceLLM.title = 'Raw Text Editor';
    completeTextHuggingfaceLLM.documentation = 'Displays or intakes text data.';

    completeTextHuggingfaceLLM.newInputSocket('text', {
        label: 'Text',
        documentation: 'Text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    completeTextHuggingfaceLLM.newInputSocket('modelId', {
        label: 'Model ID',
        documentation: 'Hugginface Model ID',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    completeTextHuggingfaceLLM.newInputSocket('maxTokens', {
        label: 'Max Tokens',
        documentation: 'Largest number of tokens to allocate.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1000).build(),
    });

    completeTextHuggingfaceLLM.newOutputSocket('completed_text', {
        label: 'Completed Text',
        documentation: 'The prediced next tokens.',
        type: 'string',
    });

    completeTextHuggingfaceLLM.code = `console.error("completeTextHuggingfaceLLM node not implemented")`;

    const mdTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'md_text_editor'
        );
    mdTextEditor.title = 'Markdown Text Editor';
    mdTextEditor.documentation =
        'Displays or intakes text data, rendered as markdown.';

    mdTextEditor.newInputSocket('text', {
        label: 'Text',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    mdTextEditor.newOutputSocket('text', {
        label: 'Text',
        documentation: '',
        type: 'string',
    });

    mdTextEditor.code = `outputs.set("text", inputs.text);`;

    const textTemplateFillin =
        await nodeBluePrintController.initOfficialNodeBluePrint('template');
    textTemplateFillin.title = 'Template Text';
    textTemplateFillin.documentation =
        'Replaces @x with the value of x, a string value. Filled in during computation.';

    textTemplateFillin.newInputSocket('template', {
        label: 'Text',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    textTemplateFillin.newInputSocket('fillins', {
        label: 'Text',
        documentation: '',
        type: 'Record<string, string>',
        params: new GenericSocketParamsBuilder({}).build(),
    });

    textTemplateFillin.newOutputSocket('text', {
        label: 'Filled in Template',
        documentation: '',
        type: 'string',
    });

    // should iterate through the keys of inputs.fillins and replace the keys in the text
    textTemplateFillin.code = `
let filledIn = inputs.template;
for ()
outputs.set("text", inputs.text);
`;

    const imageLoader =
        await nodeBluePrintController.initOfficialNodeBluePrint('image_loader');
    imageLoader.title = 'Image Loader';
    imageLoader.documentation = 'Read in an image from a socket/file.';

    imageLoader.newInputSocket('imageOrFileOrString', {
        label: 'Upload Image',
        documentation: 'Image uploaded from file.',
        type: 'file',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    imageLoader.newOutputSocket('image', {
        label: 'Image',
        documentation: 'The image you viewed.',
        type: 'image/jimp',
    });

    imageLoader.code = `
const imageOrFileOrString = inputs.imageOrFileOrString;

if (typeof imageOrFileOrString === 'string') {
    // assume this is a base64 string
    const buffer = Buffer.from(imageOrFileOrString, 'base64');
    outputs.set('image', await utils.Jimp.read(arrayBuffer));
} else if (imageOrFileOrString instanceof File) {
    const arrayBuffer = await imageOrFileOrString.arrayBuffer();
    outputs.set('image', await utils.Jimp.read(arrayBuffer));
} else {
    // assume this is a jimp already
    outputs.set('image', imageOrFileOrString);
}
`;

    const htmlRenderer =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'html_renderer'
        );
    htmlRenderer.title = 'HTML Renderer';
    htmlRenderer.documentation = 'Display arbitrary html in iframe.';

    htmlRenderer.newInputSocket('html', {
        label: 'HTML',
        documentation: 'HTML to display in iframe.',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    htmlRenderer.code = `
console.log(inputs);
const file = inputs.image;
console.log("[image_loader] received file:", typeof file);

const arrayBuffer = await file.arrayBuffer();

// read image using Jimp
const img = await utils.Jimp.read(arrayBuffer);

outputs.set('image', img);
`;


    const jsNode =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'js'
        );
    jsNode.title = 'JS Node';
    jsNode.documentation = 'Modify JS in a Node Environment';

    jsNode.newInputSocket('js_code', {
        label: 'JS',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });

    jsNode.newOutputSocket('outputText', {
        label: 'Return',
        documentation: '',
        type: 'unknown',
    });

    jsNode.code = `outputs.set("outputText", inputs.inputText);`;
}
