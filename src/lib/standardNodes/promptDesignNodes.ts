import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/FirestoreNodeBluePrint.js';
import { StringSocketParamsBuilder } from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function promptDesignNodes() {
    const joinText =
        await nodeBluePrintController.initOfficialNodeBluePrint('join_text');
    joinText.title = 'Join Text (4)';
    joinText.documentation = "Join text. 'A'+'B'='AB'";
    joinText.tags = [
        'text',
        'string',
        'join',
        'concatenation',
        'merge',
        'combine',
        'prompt',
        'assembly',
        'composition',
        'template',
        'building',
        'utility'
    ]

    await joinText.newInputSocket('text1', {
        label: 'Text',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text2', {
        label: 'Text',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text3', {
        label: 'Text',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text4', {
        label: 'Text',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await joinText.newOutputSocket('text', {
        label: 'Joined Text',
        documentation: 'Text. Joined.',
        type: STANDARD_DATATYPES.STRING,
    });

    joinText.code =
        "outputs.set('text', inputs.text1+inputs.text2+inputs.text3+inputs.text4);";

    const splitText =
        await nodeBluePrintController.initOfficialNodeBluePrint('split_text');
    splitText.title = 'Split Text';
    splitText.documentation = 'Splits text by seperator (sep).';
    splitText.tags = [
        'text',
        'string',
        'split',
        'separation',
        'parsing',
        'tokenization',
        'delimiter',
        'array',
        'breakdown',
        'segmentation',
        'extraction',
        'utility'
    ]

    await splitText.newInputSocket('text', {
        label: 'Text',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').build(),
    });
    await splitText.newInputSocket('sep', {
        label: 'Seperator',
        documentation: 'String of text.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder(',').build(),
    });

    await splitText.newOutputSocket('splitText', {
        label: 'Split Text',
        documentation: 'Text. Split.',
        type: 'unknown[]',
    });

    splitText.code = "outputs.set('splitText', inputs.text.split(inputs.sep));";
}
