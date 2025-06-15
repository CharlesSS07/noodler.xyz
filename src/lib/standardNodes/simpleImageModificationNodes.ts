import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function simpleImageModificationNodes() {
    const imageViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('image_viewer');
    imageViewer.title = 'Image Viewer';
    imageViewer.documentation = 'Display an image from a socket.';

    imageViewer.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image to view.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    imageViewer.newOutputSocket('img', {
        label: 'Image',
        documentation: 'The image you viewed.',
        type: 'image/jimp',
    });

    imageViewer.code = `
outputs.set('img', inputs.img);
`;

    // Use it to convert the base64 to jimp for supporting subsequent operations
    // const base64ToJimp = await nodeBluePrintController.initOfficialNodeBluePrint("base64_to_jimp");
    // await base64ToJimp.setTitle("Base64 to JIMP");
    // await base64ToJimp.setDocumentation("Convert a base64-encoded image string into a JIMP object for further image processing.");

    // await base64ToJimp.newInputSocket("img", {
    //   label: "Base64 Image",
    //   documentation: "Base64 encoded image string",
    //   type: "UploadImage",
    //   config: {
    //     defaultValue: null
    //   }
    // });

    // await base64ToJimp.newOutputSocket("img", {
    //   label: "JIMP Image",
    //   type: "JIMP",
    //   documentation: "Image as a JIMP object"
    // });

    // await base64ToJimp.setCode(`
    //   const Jimp = require('jimp');
    //   const input = inputs.get('img');

    //   if (typeof input === 'string' && input.startsWith('data:image')) {
    //     const base64 = input.split(',')[1];
    //     const img = await Jimp.read(Buffer.from(base64, 'base64'));
    //     outputs.set('img', img);
    //   } else {
    //     throw new Error("Input is not a valid base64 image.");
    //   }
    // ` );

    const grayscale =
        await nodeBluePrintController.initOfficialNodeBluePrint('greyscale');
    grayscale.title = 'Greyscale';
    grayscale.documentation = 'Greyscales an image.';

    await grayscale.newInputSocket('img', {
        label: 'Color Image',
        documentation: 'Color image to greyscale.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await grayscale.newOutputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale version of input image.',
        type: 'image/jimp',
    });

    grayscale.code = `
const img = inputs.img.clone();
img.greyscale();
outputs.set('img', img);
`;

    const hsv = await nodeBluePrintController.initOfficialNodeBluePrint('hsv');
    hsv.title = 'HSV Shift Change';
    hsv.documentation = 'Shift hue, saturation, or value of the input image.';

    await hsv.newInputSocket('img', {
        label: 'Input Image',
        documentation: 'Any image.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });
    await hsv.newInputSocket('hue', {
        label: 'Hue Shift',
        documentation: 'Amount to shift hue by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(360)
            .setStep(0.1)
            .build(),
    });
    await hsv.newInputSocket('saturation', {
        label: 'Saturation Shift',
        documentation: 'Amount to shift saturation by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });
    await hsv.newInputSocket('value', {
        label: 'Value Shift',
        documentation: 'Amount to shift brightness/darkness by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });

    await hsv.newOutputSocket('img', {
        label: 'Output Image',
        documentation: 'Shifted image.',
        type: 'image/jimp',
    });

    hsv.code =
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