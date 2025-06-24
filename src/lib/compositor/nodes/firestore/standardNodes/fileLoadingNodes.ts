import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/nodes/firestore/FirestoreNodeBluePrint.js';
import { JIMPImageSocketParamsBuilder } from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function fileLoadingNodes() {
    const loadExcel =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_excel');
    loadExcel.title = 'Load Excel Spreadsheet';
    loadExcel.documentation = 'Display Excel Spreadsheet';
    loadExcel.tags = [
        'file',
        'excel',
        'xlsx',
        'spreadsheet',
        'data',
        'loader',
        'import',
        'office',
        'microsoft',
        'tabular',
        'cells',
        'business',
        'not-implemented'
    ]

    await loadExcel.newInputSocket('xlsx_file', {
        label: '.xlsx',
        documentation: 'Excel File',
        type: STANDARD_DATATYPES.FILE,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await loadExcel.newOutputSocket('json', {
        label: 'JSON dict',
        documentation: 'Json dictionary of spreadsheet',
        type: 'json',
    });

    loadExcel.code = "console.error('Not Implemented');";
}
