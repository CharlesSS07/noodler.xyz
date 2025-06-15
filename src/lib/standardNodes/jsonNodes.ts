import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { GenericSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function jsonNodes() {
    const jsonEditorAndViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('json_editor');
    jsonEditorAndViewer.title = 'JSON';
    jsonEditorAndViewer.documentation =
        'Create, or view a single instance of a JSON object.';

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

    await jsonToString.newInputSocket('jsonObject', {
        label: 'Object',
        documentation: 'Object to stringify into JSON.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await jsonToString.newOutputSocket('jsonString', {
        label: 'Text',
        documentation: 'The string JSON.',
        type: 'string',
    });

    jsonToString.code =
        "outputs.set('jsonString', JSON.stringify(inputs.jsonObject));";
}
