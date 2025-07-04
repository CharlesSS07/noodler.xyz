import type { NodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '$lib/compositor/libs/firestore/FirestoreNodeBluePrint.js';
import {
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
} from '$lib/compositor/SocketParamBuilders.js';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function jimpNodes() {
    const newBlankImage =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_new_blank_image'
        );
    newBlankImage.title = 'New Image';
    newBlankImage.documentation = 'Generates a new image from parameters.';
    newBlankImage.tags = [
        'image',
        'jimp',
        'generator',
        'creation',
        'blank',
        'canvas',
        'new',
        'color',
        'solid',
        'background',
        'dimensions',
        'graphics',
    ];

    await newBlankImage.newInputSocket('color', {
        label: 'Color',
        documentation: 'Color of solid image background.',
        type: 'Color',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await newBlankImage.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The new images.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    newBlankImage.code =
        "outputs.set('image', new utils.Jimp({ width: inputs.width, height: inputs.height, color: inputs.color }));";

    const resize =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_resize_image'
        );
    resize.title = 'Resize Image';
    resize.documentation = 'Resizes a Jimp Image';
    resize.tags = [
        'image',
        'jimp',
        'resize',
        'scale',
        'dimensions',
        'transform',
        'width',
        'height',
        'processing',
        'optimization',
        'graphics',
        'modification',
    ];

    await resize.newInputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The high-res images.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await resize.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: STANDARD_DATATYPES.NUMBER,
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The resized images.',
        type: STANDARD_DATATYPES.IMAGE_JIMP,
    });

    resize.code = `const img2 = inputs.image.clone();
img2.resize({
  'w': Math.floor(inputs.width),
  'h': Math.floor(inputs.height)
});
outputs.set('image', img2);`;
}
