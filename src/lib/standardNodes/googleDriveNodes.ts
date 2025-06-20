import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/FirestoreNodeBluePrint.js';
import { StringSocketParamsBuilder } from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function googleDriveNodes() {
    const googleDrive = await nodeBluePrintController.initOfficialNodeBluePrint(
        'get_file_from_google_drive'
    );
    googleDrive.title = 'Google Drive';
    googleDrive.documentation =
        'Retrieves a file from a google drive. Requires access to the google drive.';
    googleDrive.tags = [
        'google',
        'drive',
        'cloud',
        'storage',
        'file',
        'remote',
        'download',
        'fetch',
        'oauth',
        'authentication',
        'gsuite',
        'workspace'
    ]

    await googleDrive.newInputSocket('account', {
        label: 'Google Account',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asPassword().build(),
    });

    await googleDrive.newInputSocket('file_selector', {
        label: 'File Selector',
        documentation: 'File to retrieve.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await googleDrive.newOutputSocket('file', {
        label: 'File',
        documentation: 'The retrieved file.',
        type: STANDARD_DATATYPES.STRING,
    });

    googleDrive.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;

    const sendEmail =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'send_email_google'
        );
    sendEmail.title = 'Send Email';
    sendEmail.documentation =
        'Retrieves a file from a google drive. Requires access to the google drive.';
    sendEmail.tags = [
        'email',
        'google',
        'gmail',
        'send',
        'communication',
        'remote',
        'smtp',
        'message',
        'notification',
        'oauth',
        'mail',
        'correspondence'
    ]

    await sendEmail.newInputSocket('account', {
        label: 'From Google Account',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asPassword().build(),
    });

    await sendEmail.newInputSocket('to', {
        label: 'To',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('cc', {
        label: 'CC',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('bcc', {
        label: 'BCC',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('subject', {
        label: 'Subject',
        documentation: 'Google account to get the file from.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('body', {
        label: 'Email Body',
        documentation: 'File to retrieve.',
        type: STANDARD_DATATYPES.STRING,
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    sendEmail.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;
}
