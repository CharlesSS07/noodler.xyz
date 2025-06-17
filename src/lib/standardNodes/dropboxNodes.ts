import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { JIMPImageSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '../../routes/app/lib/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function dropboxNodes() {
    const saveDropbox =
        await nodeBluePrintController.initOfficialNodeBluePrint('save_dropbox');
    saveDropbox.title = 'Save to Dropbox';
    saveDropbox.documentation = 'Saves the image to Dropbox';

    await saveDropbox.newInputSocket('image_file', {
        label: 'Image',
        documentation: 'Image File',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    saveDropbox.code = "console.error('Not Implemented');";

    const loadDropbox =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_dropbox');
    loadDropbox.title = 'Load from Dropbox';
    loadDropbox.documentation = 'Loads the Image from Dropbox';

    await loadDropbox.newOutputSocket('image_file', {
        label: 'Image',
        documentation: 'Image File',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    loadDropbox.code = "console.error('Not Implemented');";
}
