import type { NodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from '../../routes/app/lib/FirestoreNodeBluePrint.js';
import {
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
} from '../../routes/app/lib/SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

export async function jimpNodes() {
    const newBlankImage =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_new_blank_image'
        );
    newBlankImage.title = 'New Image';
    newBlankImage.documentation = 'Generates a new image from parameters.';

    await newBlankImage.newInputSocket('color', {
        label: 'Color',
        documentation: 'Color of solid image background.',
        type: 'Color',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await newBlankImage.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The new images.',
        type: 'image/jimp',
    });

    newBlankImage.code =
        "outputs.set('image', new utils.Jimp({ width: inputs.width, height: inputs.height, color: inputs.color }));";

    const resize =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_resize_image'
        );
    resize.title = 'Resize Image';
    resize.documentation = 'Resizes a Jimp Image';

    await resize.newInputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The high-res images.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await resize.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The resized images.',
        type: 'image/jimp',
    });

    resize.code = `const img2 = inputs.image.clone();
img2.resize({
  'w': Math.floor(inputs.width),
  'h': Math.floor(inputs.height)
});
outputs.set('image', img2);`;
}
