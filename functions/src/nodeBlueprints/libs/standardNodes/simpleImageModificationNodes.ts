import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/firestore/FirestoreNodeBluePrint.js';
import {
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
} from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function simpleImageModificationNodes() {
    const grayscale =
        await nodeBluePrintController.initOfficialNodeBluePrint('greyscale');
    grayscale.title = 'Greyscale';
    grayscale.documentation = 'Greyscales an image.';
    grayscale.tags = [
        'image',
        'jimp',
        'grayscale',
        'greyscale',
        'filter',
        'color',
        'monochrome',
        'black-white',
        'vintage',
        'artistic',
        'processing',
        'desaturation',
    ];

    await grayscale.newInputSocket('img', {
        label: 'Color Image',
        documentation: 'Color image to greyscale.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await grayscale.newOutputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale version of input image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    grayscale.code = `
const img = inputs.img.clone();
img.greyscale();
outputs.set('img', img);
`;

    const hsv = await nodeBluePrintController.initOfficialNodeBluePrint('hsv');
    hsv.title = 'HSV Shift Change';
    hsv.documentation = 'Shift hue, saturation, or value of the input image.';
    hsv.tags = [
        'image',
        'jimp',
        'hsv',
        'hue',
        'saturation',
        'value',
        'color',
        'adjustment',
        'brightness',
        'vibrancy',
        'color-correction',
        'enhancement',
        'artistic',
    ];

    hsv.newInputSocket('img', {
        label: 'Input Image',
        documentation: 'Any image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });
    hsv.newInputSocket('hue', {
        label: 'Hue Shift',
        documentation: 'Amount to shift hue by.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(360)
            .setStep(0.1)
            .build(),
    });
    hsv.newInputSocket('saturation', {
        label: 'Saturation Shift',
        documentation: 'Amount to shift saturation by.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });
    hsv.newInputSocket('value', {
        label: 'Value Shift',
        documentation: 'Amount to shift brightness/darkness by.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });

    hsv.newOutputSocket('img', {
        label: 'Output Image',
        documentation: 'Shifted image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    hsv.code =
        'console.log(inputs.img);\n' +
        'const img = inputs.img.clone();\n' +
        'const hue = inputs.hue;\n' +
        'const saturation = inputs.saturation;\n' +
        'const value = inputs.value;\n' +
        '// Adjust hue (in degrees, -360 to 360)\n' +
        'if (hue) img.color([{ apply: "hue", params: [hue.valueOf()] }]);\n' +
        '\n' +
        '// Adjust saturation (0 to 100)\n' +
        'if (saturation) img.color([{ apply: "saturate", params: [saturation.valueOf()] }]);\n' +
        '\n' +
        '// Adjust value (0 to 100)\n' +
        'if (value) img.color([{ apply: "brighten", params: [value.valueOf()] }]);\n' +
        '\n' +
        "outputs.set('img', img);\n";
}
