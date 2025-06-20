import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/FirestoreNodeBluePrint.js';
import { JIMPImageSocketParamsBuilder } from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function aiDemoNodes() {
    const colorize =
        await nodeBluePrintController.initOfficialNodeBluePrint('colorize');
    colorize.title = 'Colorize';
    colorize.documentation = 'Colorize a grayscale image.';
    colorize.tags = [
        'ai',
        'image',
        'colorize',
        'colorization',
        'grayscale',
        'enhancement',
        'computer-vision',
        'restoration',
        'artistic',
        'ml',
        'demo',
        'not-implemented'
    ]

    await colorize.newInputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale image to colorize.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await colorize.newOutputSocket('img', {
        label: 'Color Image',
        documentation: 'Color version of input image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
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
    superResolution.tags = [
        'ai',
        'image',
        'super-resolution',
        'enhancement',
        'upscaling',
        'quality',
        'computer-vision',
        'swin2sr',
        'ml',
        'demo',
        'not-implemented',
        'csi-enhance'
    ]

    await superResolution.newInputSocket('img', {
        label: 'Low-res Image',
        documentation: 'Image to enhance.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await superResolution.newOutputSocket('super_res_img', {
        label: 'High-res Image',
        documentation: 'Enhanced image.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
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
    objectBackgroundSeperation.tags = [
        'ai',
        'image',
        'segmentation',
        'background-removal',
        'foreground',
        'masking',
        'object-detection',
        'computer-vision',
        'separation',
        'alpha',
        'inpainting',
        'not-implemented'
    ]

    await objectBackgroundSeperation.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image to enhance.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await objectBackgroundSeperation.newOutputSocket('foreground_img', {
        label: 'Foreground Image',
        documentation: 'Alpha-ed out background.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    await objectBackgroundSeperation.newOutputSocket('background_img', {
        label: 'Background Infilled Image',
        documentation: 'Infilled image with no foreground.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    await objectBackgroundSeperation.newOutputSocket('mask', {
        label: 'Mask',
        documentation: 'Black for background, white for foreground.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    objectBackgroundSeperation.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;
}
