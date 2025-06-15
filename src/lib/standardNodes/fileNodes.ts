import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    CSVSocketParamsBuilder,
    TSVSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function fileNodes() {
    const loadCSV =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_csv');

    loadCSV.title = 'CSV Loader';
    loadCSV.documentation =
        'Reads a CSV file and returns its raw content as plain text.';

    await loadCSV.newInputSocket('file', {
        label: 'CSV File',
        documentation: 'Upload a .csv file.',
        type: 'CSV',
        params: new CSVSocketParamsBuilder().build(),
    });

    await loadCSV.newOutputSocket('text', {
        label: 'CSV Content',
        documentation: 'Raw text content from the CSV file.',
        type: 'string',
    });

    loadCSV.code = `outputs.set('text', inputs.file.text);`;

    const loadTSV =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_tsv');

    loadTSV.title = 'TSV Loader';
    loadTSV.documentation =
        'Reads a TSV (Tab-Separated Values) file and returns its raw content as plain text.';

    await loadTSV.newInputSocket('file', {
        label: 'TSV File',
        documentation: 'Upload a .tsv file.',
        type: 'TSV',
        params: new TSVSocketParamsBuilder().build(),
    });

    await loadTSV.newOutputSocket('text', {
        label: 'TSV Content',
        documentation: 'Raw text content from the TSV file.',
        type: 'string',
    });

    loadTSV.code = `
    outputs.set('text', inputs.file.text);
  `;
}
