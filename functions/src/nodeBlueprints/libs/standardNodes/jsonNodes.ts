import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/firestore/FirestoreNodeBluePrint.js';
import { GenericSocketParamsBuilder } from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function jsonNodes() {
    const jsonEditorAndViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('json_editor');
    jsonEditorAndViewer.title = 'JSON';
    jsonEditorAndViewer.documentation =
        'Create, or view a single instance of a JSON object.';
    jsonEditorAndViewer.tags = [
        'json',
        'data',
        'object',
        'editor',
        'viewer',
        'parser',
        'structured',
        'format',
        'serialization',
        'configuration',
        'api-data',
        'interchange',
    ];

    await jsonEditorAndViewer.newInputSocket('jsonObject', {
        label: 'JSON',
        documentation: 'JSON text to parse.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await jsonEditorAndViewer.newOutputSocket('jsonObject', {
        label: 'Object',
        documentation: 'The parsed JSON object.',
        type: 'unknown',
    });

    jsonEditorAndViewer.code = `
    const jsonObject = JSON.parse(inputs.jsonObject);
    outputs.set('jsonObject', jsonObject);
    console.log('jsonObject', jsonObject, typeof jsonObject);
    `;

    const jsonToString =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'json_to_string'
        );
    jsonToString.title = 'JSON to Text';
    jsonToString.documentation = 'Stringify a JSON object.';
    jsonToString.tags = [
        'json',
        'data',
        'string',
        'serialization',
        'stringify',
        'conversion',
        'text',
        'format',
        'export',
        'transform',
        'encoding',
        'api-ready',
    ];

    await jsonToString.newInputSocket('jsonObject', {
        label: 'Object',
        documentation: 'Object to stringify into JSON.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await jsonToString.newOutputSocket('jsonString', {
        label: 'Text',
        documentation: 'The string JSON.',
        type: STANDARD_DATATYPES.STRING,
    });

    jsonToString.code =
        "outputs.set('jsonString', JSON.stringify(inputs.jsonObject));";
}
