import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { NumberSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function basicMathNodes() {
    // Add node
    const addNode =
        await nodeBluePrintController.initOfficialNodeBluePrint('add');
    addNode.title = 'Add Numbers';
    addNode.documentation = 'Adds two numbers together';

    await addNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'First number to add',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });

    await addNode.newInputSocket('b', {
        label: 'Number B',
        documentation: 'Second number to add',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });

    await addNode.newOutputSocket('result', {
        label: 'Sum',
        documentation: 'The sum of A + B',
        type: 'number',
    });

    addNode.code = `
        const a = inputs.a ?? 0;
        const b = inputs.b ?? 0;
        const result = a + b;
        outputs.set('result', result);
    `;

    // Subtract node
    const subtractNode =
        await nodeBluePrintController.initOfficialNodeBluePrint('subtract');
    subtractNode.title = 'Subtract Numbers';
    subtractNode.documentation = 'Subtracts second number from first number';

    await subtractNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'Number to subtract from',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });

    await subtractNode.newInputSocket('b', {
        label: 'Number B',
        documentation: 'Number to subtract',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });

    await subtractNode.newOutputSocket('result', {
        label: 'Difference',
        documentation: 'The result of A - B',
        type: 'number',
    });

    subtractNode.code = `
        const a = inputs.a ?? 0;
        const b = inputs.b ?? 0;
        const result = a - b;
        outputs.set('result', result);
    `;

    // Multiply node
    const multiplyNode =
        await nodeBluePrintController.initOfficialNodeBluePrint('multiply');
    multiplyNode.title = 'Multiply Numbers';
    multiplyNode.documentation = 'Multiplies two numbers together';

    await multiplyNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'First number to multiply',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });

    await multiplyNode.newInputSocket('b', {
        label: 'Number B',
        documentation: 'Second number to multiply',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });

    await multiplyNode.newOutputSocket('result', {
        label: 'Product',
        documentation: 'The product of A * B',
        type: 'number',
    });

    multiplyNode.code = `
        const a = inputs.a ?? 1;
        const b = inputs.b ?? 1;
        const result = a * b;
        outputs.set('result', result);
    `;

    // Divide node
    const divideNode =
        await nodeBluePrintController.initOfficialNodeBluePrint('divide');
    divideNode.title = 'Divide Numbers';
    divideNode.documentation = 'Divides first number by second number';

    await divideNode.newInputSocket('a', {
        label: 'Dividend',
        documentation: 'Number to be divided',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });

    await divideNode.newInputSocket('b', {
        label: 'Divisor',
        documentation: 'Number to divide by',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });

    await divideNode.newOutputSocket('result', {
        label: 'Quotient',
        documentation: 'The result of A / B',
        type: 'number',
    });

    divideNode.code = `
        const a = inputs.a ?? 1;
        const b = inputs.b ?? 1;
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        outputs.set('result', result);
    `;
}