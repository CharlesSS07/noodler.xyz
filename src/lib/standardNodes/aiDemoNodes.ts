import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import { JIMPImageSocketParamsBuilder } from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function aiDemoNodes() {
    const colorize =
        await nodeBluePrintController.initOfficialNodeBluePrint('colorize');
    colorize.title = 'Colorize';
    colorize.documentation = 'Colorize a grayscale image.';

    await colorize.newInputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale image to colorize.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await colorize.newOutputSocket('img', {
        label: 'Color Image',
        documentation: 'Color version of input image.',
        type: 'image/jimp',
    });

    colorize.code = `
  throw new Error("Colorizer Node is a Work In Progress. Please Check Back Later or Implement your Own.");
`;

    const superResolution =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'super_resolution'
        );
    superResolution.title = 'Super Resolution / "Enhance"';
    superResolution.documentation = 'Increase the resolution image.';

    await superResolution.newInputSocket('img', {
        label: 'Low-res Image',
        documentation: 'Image to enhance.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await superResolution.newOutputSocket('super_res_img', {
        label: 'High-res Image',
        documentation: 'Enhanced image.',
        type: 'image/jimp',
    });

    superResolution.code = `
throw new Error("Super resolution Node is a Work In Progress. Please Check Back Later or Implement your Own.");
const upscaler = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64');
const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/butterfly.jpg';
const output = await upscaler(url);
// RawImage {
//   data: Uint8Array(786432) [ 41, 31, 24,  43, ... ],
//   width: 512,
//   height: 512,
//   channels: 3
// }
`;

    const objectBackgroundSeperation =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'object_background_seperation'
        );
    objectBackgroundSeperation.title =
        'Separate Background & Foreground Object';
    objectBackgroundSeperation.documentation =
        'Separate a foreground object and infill the background, storing them in seperate images.';

    await objectBackgroundSeperation.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image to enhance.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await objectBackgroundSeperation.newOutputSocket('foreground_img', {
        label: 'Foreground Image',
        documentation: 'Alpha-ed out background.',
        type: 'image/jimp',
    });

    await objectBackgroundSeperation.newOutputSocket('background_img', {
        label: 'Background Infilled Image',
        documentation: 'Infilled image with no foreground.',
        type: 'image/jimp',
    });

    await objectBackgroundSeperation.newOutputSocket('mask', {
        label: 'Mask',
        documentation: 'Black for background, white for foreground.',
        type: 'image/jimp',
    });

    objectBackgroundSeperation.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;
}