import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { JIMPImageSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '../../routes/app/lib/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function fileLoadingNodes() {
    const loadExcel =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_excel');
    loadExcel.title = 'Load Excel Spreadsheet';
    loadExcel.documentation = 'Display Excel Spreadsheet';

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
