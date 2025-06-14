/**
 * Test to verify Jimp library can be imported and used in the test environment
 * This helps diagnose issues with image processing nodes that depend on Jimp
 */

import { describe, expect, test } from 'vitest';

describe('Jimp Import Tests', () => {
    test('Should be able to import Jimp from jimp package', async () => {
        // Test basic import
        const { Jimp } = await import('jimp');
        expect(Jimp).toBeDefined();
        expect(typeof Jimp).toBe('function');
    });

    test('Should be able to create a new Jimp image', async () => {
        const { Jimp } = await import('jimp');

        // Create a simple 100x100 red image
        const image = new Jimp({ width: 100, height: 100, color: '#ff0000' });

        expect(image).toBeDefined();
        expect(image.bitmap).toBeDefined();
        expect(image.bitmap.width).toBe(100);
        expect(image.bitmap.height).toBe(100);
    });

    test('Should be able to use Jimp.read() method', async () => {
        const { Jimp } = await import('jimp');

        // Create a simple image first
        const originalImage = new Jimp({
            width: 50,
            height: 50,
            color: '#00ff00',
        });

        // Try to get buffer - check if it returns a Promise
        const bufferResult = originalImage.getBuffer('image/png');
        console.log('Buffer result type:', typeof bufferResult);
        console.log('Is Promise?', bufferResult instanceof Promise);

        let buffer;
        if (bufferResult instanceof Promise) {
            buffer = await bufferResult;
        } else {
            buffer = bufferResult;
        }

        const readImage = await Jimp.read(buffer);

        expect(readImage).toBeDefined();
        expect(readImage.bitmap.width).toBe(50);
        expect(readImage.bitmap.height).toBe(50);
    });

    test('Should be able to apply greyscale transformation', async () => {
        const { Jimp } = await import('jimp');

        // Create a colorful image
        const colorImage = new Jimp({
            width: 100,
            height: 100,
            color: '#ff00ff',
        });

        // Apply greyscale
        const greyImage = colorImage.clone().greyscale();

        expect(greyImage).toBeDefined();
        expect(greyImage.bitmap.width).toBe(100);
        expect(greyImage.bitmap.height).toBe(100);
    });

    test('Should be able to apply HSV color transformations', async () => {
        const { Jimp } = await import('jimp');

        // Create a test image
        const image = new Jimp({ width: 100, height: 100, color: '#ff0000' });

        // Apply HSV transformations
        const transformedImage = image.clone();
        transformedImage.color([
            { apply: 'hue', params: [30] },
            { apply: 'saturate', params: [10] },
            { apply: 'brighten', params: [5] },
        ]);

        expect(transformedImage).toBeDefined();
        expect(transformedImage.bitmap.width).toBe(100);
        expect(transformedImage.bitmap.height).toBe(100);
    });

    test('Should be able to crop an image', async () => {
        const { Jimp } = await import('jimp');

        // Create a larger image
        const largeImage = new Jimp({
            width: 200,
            height: 200,
            color: '#0000ff',
        });

        // Crop to smaller size - use object format for crop parameters
        const croppedImage = largeImage
            .clone()
            .crop({ x: 50, y: 50, w: 100, h: 100 });

        expect(croppedImage).toBeDefined();
        expect(croppedImage.bitmap.width).toBe(100);
        expect(croppedImage.bitmap.height).toBe(100);
    });

    test('Should be able to resize an image', async () => {
        const { Jimp } = await import('jimp');

        // Create an image
        const originalImage = new Jimp({
            width: 100,
            height: 100,
            color: '#ffff00',
        });

        // Resize to different dimensions
        const resizedImage = originalImage.clone().resize({ w: 50, h: 75 });

        expect(resizedImage).toBeDefined();
        expect(resizedImage.bitmap.width).toBe(50);
        expect(resizedImage.bitmap.height).toBe(75);
    });

    test('Should be able to get base64 representation', async () => {
        const { Jimp } = await import('jimp');

        // Create a simple image
        const image = new Jimp({ width: 10, height: 10, color: '#ffffff' });

        // getBase64 likely returns a Promise too
        const base64Result = image.getBase64('image/png');
        const base64 =
            base64Result instanceof Promise ? await base64Result : base64Result;

        expect(base64).toBeDefined();
        expect(typeof base64).toBe('string');
        expect(base64).toMatch(/^data:image\/png;base64,/);
    });

    test('Should verify utils object structure for node execution', async () => {
        const { Jimp } = await import('jimp');

        // Simulate the utils object that gets passed to node execution
        const utils = {
            Jimp: Jimp,
            // Add other utilities that might be needed
        };

        expect(utils.Jimp).toBeDefined();
        expect(typeof utils.Jimp).toBe('function');

        // Test that we can use utils.Jimp just like in the node code
        const testImage = new utils.Jimp({
            width: 25,
            height: 25,
            color: '#123456',
        });
        expect(testImage.bitmap.width).toBe(25);
        expect(testImage.bitmap.height).toBe(25);
    });

    test('Should be able to read from buffer like image loader', async () => {
        const { Jimp } = await import('jimp');

        // Create an image and get its buffer
        const originalImage = new Jimp({
            width: 64,
            height: 64,
            color: '#789abc',
        });

        // Get buffer (it returns a Promise)
        const imageBuffer = await originalImage.getBuffer('image/png');

        // Simulate reading from buffer like image loader node
        const loadedImage = await Jimp.read(imageBuffer);

        expect(loadedImage).toBeDefined();
        expect(loadedImage.bitmap.width).toBe(64);
        expect(loadedImage.bitmap.height).toBe(64);
    });

    test('Should handle MIME type constants', async () => {
        const { Jimp } = await import('jimp');

        // Use standard MIME strings since constants aren't available
        const pngMime = 'image/png';
        const jpegMime = 'image/jpeg';

        expect(pngMime).toBeDefined();
        expect(jpegMime).toBeDefined();
        expect(typeof pngMime).toBe('string');

        // Test using the MIME string
        const image = new Jimp({ width: 32, height: 32, color: '#def123' });

        // getBase64 returns a Promise
        const base64 = await image.getBase64(pngMime);
        expect(base64).toContain('data:image/png');
    });
});
