import { expect } from 'chai';
import { textToImage } from './images';
import { Jimp } from 'jimp';

describe('textToImage', () => {

    it('should generate an image with valid parameters', async function() {
        this.timeout(20000); // Increase timeout for API call and image download
        const params = {
            model: 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: 'a dog wearing a hat',
            width: 128,
            height: 128,
        };

        try {
            const result = await textToImage(params);
            expect(result.data[0]).to.have.property('url');
            expect(result.data[0].url).to.be.a('string').and.not.empty;

            // Fetch the image and check dimensions
            const imageUrl = result.data[0].url;
            const image = await Jimp.read(imageUrl);
            expect(image.bitmap.width).to.equal(params.width);
            expect(image.bitmap.height).to.equal(params.height);
            console.log(image.width, image.height);
            console.log(imageUrl);

        } catch (error) {
            console.error("API call or image verification failed:", error);
            throw error; // Re-throw to fail the test
        }
    });

    it('should throw an error if prompt is empty', async () => {
        const params = {
            model: 'test-model',
            prompt: '',
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.equal('Prompt cannot be empty.');
        }
    });

    it('should throw an error if prompt is only whitespace', async () => {
        const params = {
            model: 'test-model',
            prompt: '   ',
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.equal('Prompt cannot be empty.');
        }
    });

    it('should throw an error if steps is not positive', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            steps: 0,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.equal('Steps must be a positive number.');
        }
    });

    it('should throw an error if height is too small', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            height: 100,
            width: 512,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.include('Height and width must be at least 128px.');
        }
    });

    it('should throw an error if width is too large', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            height: 512,
            width: 2000,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.include('Height and width cannot exceed 1024px.');
        }
    });

    it('should throw an error if aspect ratio is invalid', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            height: 1024,
            width: 256,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.include('Aspect ratio (width/height) must be between');
        }
    });

    it('should throw an error if only height is provided', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            height: 512,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.equal('Both height and width must be provided if either is specified.');
        }
    });

    it('should throw an error if guidance is too low', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            guidance: 0,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.include('Guidance must be between 1 and 20.');
        }
    });

    it('should throw an error if guidance is too high', async () => {
        const params = {
            model: 'test-model',
            prompt: 'a dog',
            guidance: 21,
        };
        try {
            await textToImage(params);
            expect.fail('Function did not throw an error');
        } catch (error: any) {
            expect(error.message).to.include('Guidance must be between 1 and 20.');
        }
    });
});