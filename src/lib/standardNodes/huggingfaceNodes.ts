import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function huggingfaceNodes() {
    /**
     * TODO: chat op, diffusion op, text2img op, ...
     */

    const llm =
        await nodeBluePrintController.initOfficialNodeBluePrint('promptdesign');
    llm.title = 'Large Language Model (Huggingface)';
    llm.documentation = 'Return output of LLM.';

    await llm.newInputSocket('hf_token', {
        label: 'Huggingface Login',
        documentation: 'Huggingface Account to Charge',
        type: 'HuggingfaceLogin',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await llm.newInputSocket('model_id', {
        label: 'Model ID',
        documentation: 'Initial prompt (used to instruct model on task).',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'HuggingFaceH4/zephyr-7b-alpha'
        ).build(),
    });

    await llm.newInputSocket('prompt', {
        label: 'Prompt',
        documentation:
            'Initial prompt (used to instruct model on task). This is the text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'The quick brown fox jumped over the la'
        ).build(),
    });
    await llm.newInputSocket('temp', {
        label: 'Temperature',
        documentation: 'Creativity level of the mode.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(1)
            .setStep(0.01)
            .build(),
    });
    // missing many

    await llm.newOutputSocket('output_text', {
        label: 'Completed Text',
        documentation: 'LLM output with prompt',
        type: 'number',
    });

    await llm.newOutputSocket('output_text_no_prompt', {
        label: 'Completed Text without Prompt',
        documentation: 'LLM output without prompt',
        type: 'number',
    });

    llm.code = `
const hf_token = inputs.hf_token;
const inference = await utils.APIConnectionManager.getConnector("huggingface-inference").getAPI();
const output = await inference.textGeneration({
  model: inputs.model_id,
  inputs: inputs.prompt,
});

outputs.set('output_text', output.generated_text);
outputs.set('output_text_no_prompt', output.generated_text);
`;

    // 	await promptdesign.setUnitTest(`
    // const inputs = new Map();
    // const outputs = new Map();
    //
    // inputs.set(
    //   'hf_token',
    //   'hf_oauth_eyJhbGciOiJFZERTQSJ9.eyJzY29wZSI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJpbmZlcmVuY2UtYXBpIl0sImF1ZCI6Imh0dHBzOi8vaHVnZ2luZ2ZhY2UuY28iLCJvYXV0aEFwcCI6IjIxNjRkZjlkLWJjM2YtNDk1Zi1iZGQ3LWNjOTc3ZTVkMDZjNSIsInNlc3Npb25JZCI6IjY3YzhlYmVmODYwZWFmYjYyODBmNTdkOCIsImlhdCI6MTc0Mzg5MTY3Miwic3ViIjoiNjc3ZGIzYzNkNzFiNWYxMDhkZDU4MjIyIiwiZXhwIjoxNzQ2NDgzNjcyLCJpc3MiOiJodHRwczovL2h1Z2dpbmdmYWNlLmNvIn0.S3moSoEFjH4jTnvgNgxGaRsScZT9C68VTt2cpBIJhsJs01VAhcCb2HrZKTYIIp3FzhHptWTtg-Fa9AfT69XaAQ'
    // );
    // inputs.set('model_id', 'HuggingFaceH4/zephyr-7b-alpha');
    // inputs.set('temp', 0.5);
    // inputs.set('prompt', 'The quick brown fox jumped over the la');
    //
    // call(inputs, outputs);
    //
    // console.log(outputs);
    // `
    // 	);

    const text_to_image =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'text_to_image'
        );
    text_to_image.title = 'Text to Image (Huggingface)';
    text_to_image.documentation = 'Generates Image Given Text';

    await text_to_image.newInputSocket('hf_token', {
        label: 'Huggingface Login',
        documentation: 'Huggingface Account to Charge',
        type: 'HuggingfaceLogin',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await text_to_image.newInputSocket('model_id', {
        label: 'Model ID',
        documentation:
            'Model to generate from (serch text-to-image models category on huggingface.com).',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'black-forest-labs/FLUX.1-dev'
        ).build(),
    });

    await text_to_image.newInputSocket('prompt', {
        label: 'Text Prompt',
        documentation:
            'Initial prompt (used to instruct model on task). This is the text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'shrek riding a motor cycle over an exploding galaxy, being chased by a dragon (the wedjat eye is the eye of horus from egyptian mythology) make the galaxy look like the wedjat eye. there should be no ground, just space with the exploding galaxy in the background'
        ).build(),
    });
    await text_to_image.newInputSocket('temp', {
        label: 'Temperature',
        documentation: 'Creativity level of the model.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(1)
            .setStep(0.01)
            .build(),
    });
    // missing many

    await text_to_image.newOutputSocket('image', {
        label: 'Generated Image',
        documentation: 'Image generated from the input specifications.',
        type: 'image/jimp',
    });

    text_to_image.code = `
// inputs, outputs, utils
const hf_token = inputs.hf_token;
const inference = await utils.APIConnectionManager.getConnector("huggingface-inference").getAPI();
const blob = await inference.textToImage({
    inputs: inputs.prompt,
    model: inputs.model_id,
});

const buffer = await new Response(blob).arrayBuffer();
const image = await utils.Jimp.read(buffer);

outputs.set('image', image);
`;
}
